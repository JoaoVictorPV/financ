import { NextResponse } from "next/server";
import type { MarketPayload } from "@/features/market/domain/types";

export const revalidate = 300; // 5 minutos (cache do Next)

// Cache em memória (funciona bem no dev e geralmente no serverless quente)
let CACHE: MarketPayload | null = null;
let CACHE_AT = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function parseStooqCsvRow(csv: string): {
  symbol: string;
  date: string;
  close: number | null;
  open: number | null;
} | null {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const row = lines[1]!.split(",");
  if (row.length < 7) return null;
  const symbol = row[0] ?? "";
  const date = row[1] ?? "";
  const openRaw = row[3] ?? "";
  const closeRaw = row[6] ?? "";
  if (closeRaw === "N/D" || closeRaw === "N/A" || closeRaw === "") return null;
  const close = Number(closeRaw);
  const open = openRaw && openRaw !== "N/D" ? Number(openRaw) : null;
  return {
    symbol,
    date,
    close: Number.isFinite(close) ? close : null,
    open: open != null && Number.isFinite(open) ? open : null,
  };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Fin.SYS" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function safeFetchText(label: string, url: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const text = await fetchText(url);
    return { ok: true, text };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `${label}: ${msg}` };
  }
}

function parseFREDLastNumberFromCsv(csvText: string): number | null {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  // percorre ao contrário procurando última linha com valor
  for (let i = lines.length - 1; i >= 1; i--) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const v = parts[1]!.trim();
    if (!v || v === ".") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseBcbNumber(v: string | undefined): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function ymdFromBcbDate(dmy: string | undefined): string | null {
  if (!dmy) return null;
  const [dd, mm, yyyy] = dmy.split("/");
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Fin.SYS" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function safeFetch<T>(label: string, url: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const data = await fetchJson<T>(url);
    return { ok: true, data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `${label}: ${msg}` };
  }
}

export async function GET() {
  // Cache primeiro (evita rate-limit principalmente do CoinGecko)
  const now = Date.now();
  if (CACHE && now - CACHE_AT < CACHE_TTL_MS) {
    return NextResponse.json({ ...CACHE, meta: { ...(CACHE.meta ?? {}), stale: false } });
  }

  type CoinGeckoSimplePrice = {
    bitcoin?: { brl?: number; usd?: number };
    "tether-gold"?: { usd?: number; brl?: number };
    "pax-gold"?: { usd?: number; brl?: number };
  };
  type BcbSgsRow = { data: string; valor: string };

  type ErApi = { rates: Record<string, number>; time_last_update_unix?: number };

  const [fxR, cryptoR, selicR, ipcaR, t10y2yR, m2R, dxyR, xauR, xagR, globalR] = await Promise.all([
    safeFetch<ErApi>("fx", "https://open.er-api.com/v6/latest/USD"),
    safeFetch<CoinGeckoSimplePrice>(
      "crypto",
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether-gold,pax-gold&vs_currencies=brl,usd",
    ),
    safeFetch<BcbSgsRow[]>(
      "selic",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/10?formato=json",
    ),
    safeFetch<BcbSgsRow[]>(
      "ipca",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/24?formato=json",
    ),
    safeFetchText("t10y2y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y2Y"),
    safeFetchText("m2", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=WM2NS"),
    safeFetchText("dxy", "https://stooq.com/q/l/?s=dx.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("xau", "https://stooq.com/q/l/?s=xauusd&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("xag", "https://stooq.com/q/l/?s=xagusd&f=sd2t2ohlcv&h&e=csv"),
    safeFetch<{ data: { market_cap_percentage: Record<string, number> } }>(
      "global",
      "https://api.coingecko.com/api/v3/global",
    ),
  ]);

  const warnings = [
    fxR.ok ? null : fxR.error,
    cryptoR.ok ? null : cryptoR.error,
    selicR.ok ? null : selicR.error,
    ipcaR.ok ? null : ipcaR.error,
    t10y2yR.ok ? null : t10y2yR.error,
    m2R.ok ? null : m2R.error,
    dxyR.ok ? null : dxyR.error,
    xauR.ok ? null : xauR.error,
    xagR.ok ? null : xagR.error,
    globalR.ok ? null : globalR.error,
  ].filter((x): x is string => Boolean(x));

  // se falhou algo e temos cache antigo, devolve cache para não quebrar UI
  if (warnings.length > 0 && CACHE) {
    const payload: MarketPayload = {
      ...CACHE,
      meta: {
        stale: true,
        note: `Usando cache (falha externa): ${warnings.join(" | ")}`,
      },
    };
    return NextResponse.json(payload);
  }

  // sem cache (ou sem falhas): segue normal (se algo falhar e não tem cache, retorna valores parciais)
  const fx = fxR.ok ? fxR.data : { rates: {} };
  const crypto = cryptoR.ok ? cryptoR.data : {};
  const selic = selicR.ok ? selicR.data : [];
  const ipca = ipcaR.ok ? ipcaR.data : [];

  const usd_brl = fx.rates?.BRL;
  const usd_eur = fx.rates?.EUR;
  const usd_cny = fx.rates?.CNY;
  const eur_brl = usd_brl && usd_eur ? usd_brl / usd_eur : undefined;
  const cny_brl = usd_brl && usd_cny ? usd_brl / usd_cny : undefined;

  const btc_brl = crypto.bitcoin?.brl;
  const btc_usd = crypto.bitcoin?.usd;
  const btc_dominance = globalR.ok ? globalR.data.data.market_cap_percentage.btc : undefined;

  // ouro: preferir XAUUSD via Stooq; fallback via PAXG do CoinGecko
  const xau_usd = xauR.ok ? parseStooqCsvRow(xauR.text)?.close ?? undefined : undefined;
  const xag_usd = xagR.ok ? parseStooqCsvRow(xagR.text)?.close ?? undefined : undefined;
  const paxg_usd = crypto["pax-gold"]?.usd;
  const paxg_brl = crypto["pax-gold"]?.brl;
  const xauUsdFinal = xau_usd ?? paxg_usd;
  const gold_brl_oz = xauUsdFinal != null && usd_brl != null ? xauUsdFinal * usd_brl : paxg_brl;
  const gold_brl_g = gold_brl_oz != null ? gold_brl_oz / 31.1034768 : undefined;

  const gold_silver_ratio = xauUsdFinal != null && xag_usd != null && xag_usd !== 0 ? xauUsdFinal / xag_usd : undefined;

  const lastSelic = selic?.[selic.length - 1];
  const brl_selic_aa = lastSelic?.valor != null
    ? Number(String(lastSelic.valor).replace(",", ".")) / 100
    : undefined;

  const lastIpca = ipca?.[ipca.length - 1];
  const brl_ipca_mom = lastIpca && lastIpca.valor != null
    ? (parseBcbNumber(lastIpca.valor) ?? 0) / 100
    : undefined;

  // IPCA 12m (a partir dos últimos 12 meses)
  const ipcaLast12 = ipca.slice(-12).map((r) => (parseBcbNumber(r.valor) ?? 0) / 100);
  const brl_ipca_12m = ipcaLast12.length
    ? ipcaLast12.reduce((acc, x) => acc * (1 + x), 1) - 1
    : undefined;

  const brl_selic_real_simple =
    brl_selic_aa != null && brl_ipca_12m != null ? brl_selic_aa - brl_ipca_12m : undefined;
  const brl_selic_real_fisher =
    brl_selic_aa != null && brl_ipca_12m != null
      ? (1 + brl_selic_aa) / (1 + brl_ipca_12m) - 1
      : undefined;

  const t10y2y = t10y2yR.ok ? parseFREDLastNumberFromCsv(t10y2yR.text) ?? undefined : undefined;
  const m2_usd_bil = m2R.ok ? parseFREDLastNumberFromCsv(m2R.text) ?? undefined : undefined;
  const dxy = dxyR.ok ? parseStooqCsvRow(dxyR.text)?.close ?? undefined : undefined;

  const payload: MarketPayload = {
    fetchedAt: new Date().toISOString(),
    values: {
      usd_brl,
      eur_brl,
      cny_brl,
      btc_brl,
      btc_usd,
      btc_dominance,

      xau_usd: xauUsdFinal,
      xag_usd,
      gold_silver_ratio,
      gold_brl_oz,
      gold_brl_g,

      dxy,
      t10y2y,
      m2_usd_bil,

      brl_selic_aa,
      brl_ipca_mom,
      brl_ipca_12m,
      brl_selic_real_simple,
      brl_selic_real_fisher,
    },
    source: {
      fx: "open.er-api.com",
      crypto: "coingecko",
      selic: "bcb-sgs-432",
      fred: "fredgraph.csv",
      stooq: "stooq csv",
    },
    meta: warnings.length ? { stale: false, note: warnings.join(" | "), errors: warnings } : { stale: false },
  };

  CACHE = payload;
  CACHE_AT = now;

  return NextResponse.json(payload);
}
