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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const res = await fetchWithTimeout(
    url,
    {
      headers: { "User-Agent": "Fin.SYS" },
      cache: "no-store",
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function safeFetchText(label: string, url: string, timeoutMs = 8000): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const text = await fetchText(url, timeoutMs);
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

function extractFirstNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const n = Number(match[1].replace(",", "."));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

async function fetchYahooChart(symbol: string) {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=5d`;
  return await safeFetch<{ chart: { result?: Array<{ meta?: { regularMarketPrice?: number } }> } }>(
    `yahoo:${symbol}`,
    url,
  );
}

function ymdFromBcbDate(dmy: string | undefined): string | null {
  if (!dmy) return null;
  const [dd, mm, yyyy] = dmy.split("/");
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const res = await fetchWithTimeout(
    url,
    {
      headers: { "User-Agent": "Fin.SYS" },
      cache: "no-store",
    },
    timeoutMs,
  );
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

function parseStooqClose(text?: string): number | undefined {
  if (!text) return undefined;
  return parseStooqCsvRow(text)?.close ?? undefined;
}

function computeChangePct(open?: number | null, close?: number | null): number | undefined {
  if (open == null || close == null || open === 0) return undefined;
  return (close - open) / open;
}

async function fetchSgeAu9999CnyG(): Promise<number | undefined> {
  const endpoints = [
    "https://www.sge.com.cn/sge_data/quoteData",
    "https://www.sge.com.cn/sge-data/quoteData",
    "https://www.sge.com.cn/sge_data/quotDaily",
  ];

  for (const url of endpoints) {
    const r = await safeFetchText("sge", url, 4000);
    if (!r.ok) continue;
    const raw = r.text;
    try {
      const json = JSON.parse(raw);
      const list = json?.data || json?.Data || json?.list || json?.List || [];
      const item = Array.isArray(list)
        ? list.find((x) => String(x?.product || x?.Product || x?.name || x?.Name || "").includes("Au99.99"))
        : null;
      const value = item?.close || item?.Close || item?.price || item?.Price || item?.last || item?.Last;
      const n = Number(String(value).replace(",", "."));
      if (Number.isFinite(n)) return n;
    } catch {
      const n = extractFirstNumber(raw, [
        /Au99\.99[^0-9]{0,20}([0-9]+\.?[0-9]*)/i,
        /Au99\.99[^0-9]{0,20}([0-9]+,[0-9]*)/i,
      ]);
      if (n != null) return n;
    }
  }
  return undefined;
}

async function fetchBrazilCdsBps(): Promise<number | undefined> {
  const r = await safeFetchText(
    "cds",
    "https://www.worldgovernmentbonds.com/cds-historical-data/brazil/5-years/",
    5000,
  );
  if (!r.ok) return undefined;
  const html = r.text;
  return extractFirstNumber(html, [
    /Last[^0-9]{0,20}([0-9]{2,4}\.?[0-9]{0,2})/i,
    /Latest[^0-9]{0,20}([0-9]{2,4}\.?[0-9]{0,2})/i,
    /CDS[^0-9]{0,20}([0-9]{2,4}\.?[0-9]{0,2})/i,
  ]);
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

  const [
    fxR,
    cryptoR,
    selicR,
    ipcaR,
    t10y2yR,
    m2R,
    dxyR,
    xauR,
    xagR,
    globalR,
    us2yR,
    us10yR,
    fedFundsR,
    tips10yR,
    vixR,
    wtiR,
    natgasR,
    copperR,
    wheatR,
    cornR,
    soyR,
    sugarR,
    coffeeR,
    cottonR,
    platinumR,
    palladiumR,
    gasolineR,
    heatingOilR,
    aluminumR,
    nickelR,
    remxR,
    litR,
    uraR,
    usdbrlR,
    eurbrlR,
    cnybrlR,
    jpybrlR,
    usdjpyR,
    usdcnyR,
    sgeR,
    cdsR,
    ibovR,
  ] = await Promise.all([
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

    // FRED (juros EUA)
    safeFetchText("us2y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS2"),
    safeFetchText("us10y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10"),
    safeFetchText("fedfunds", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=EFFR"),
    safeFetchText("tips10y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII10"),

    // VIX (Yahoo)
    fetchYahooChart("^VIX"),

    // Commodities / futuros (Stooq)
    safeFetchText("wti", "https://stooq.com/q/l/?s=cl.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("natgas", "https://stooq.com/q/l/?s=ng.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("copper", "https://stooq.com/q/l/?s=hg.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("wheat", "https://stooq.com/q/l/?s=zw.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("corn", "https://stooq.com/q/l/?s=zc.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("soy", "https://stooq.com/q/l/?s=zs.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("sugar", "https://stooq.com/q/l/?s=sb.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("coffee", "https://stooq.com/q/l/?s=kc.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("cotton", "https://stooq.com/q/l/?s=ct.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("platinum", "https://stooq.com/q/l/?s=pl.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("palladium", "https://stooq.com/q/l/?s=pa.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("gasoline", "https://stooq.com/q/l/?s=rb.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("heating_oil", "https://stooq.com/q/l/?s=ho.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("aluminum", "https://stooq.com/q/l/?s=al.f&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("nickel", "https://stooq.com/q/l/?s=ni.f&f=sd2t2ohlcv&h&e=csv"),

    // ETFs proxy (elementos críticos)
    safeFetchText("remx", "https://stooq.com/q/l/?s=remx.us&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("lit", "https://stooq.com/q/l/?s=lit.us&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("ura", "https://stooq.com/q/l/?s=ura.us&f=sd2t2ohlcv&h&e=csv"),

    // FX via Stooq (para históricos/gráficos e redundância)
    safeFetchText("usdbrl", "https://stooq.com/q/l/?s=usdbrl&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("eurbrl", "https://stooq.com/q/l/?s=eurbrl&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("cnybrl", "https://stooq.com/q/l/?s=cnybrl&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("jpybrl", "https://stooq.com/q/l/?s=jpybrl&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("usdjpy", "https://stooq.com/q/l/?s=usdjpy&f=sd2t2ohlcv&h&e=csv"),
    safeFetchText("usdcny", "https://stooq.com/q/l/?s=usdcny&f=sd2t2ohlcv&h&e=csv"),
    fetchSgeAu9999CnyG(),
    fetchBrazilCdsBps(),
    fetchYahooChart("^BVSP"),
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
    us2yR.ok ? null : us2yR.error,
    us10yR.ok ? null : us10yR.error,
    fedFundsR.ok ? null : fedFundsR.error,
    tips10yR.ok ? null : tips10yR.error,
    vixR.ok ? null : vixR.error,
    wtiR.ok ? null : wtiR.error,
    natgasR.ok ? null : natgasR.error,
    copperR.ok ? null : copperR.error,
    wheatR.ok ? null : wheatR.error,
    cornR.ok ? null : cornR.error,
    soyR.ok ? null : soyR.error,
    sugarR.ok ? null : sugarR.error,
    coffeeR.ok ? null : coffeeR.error,
    cottonR.ok ? null : cottonR.error,
    platinumR.ok ? null : platinumR.error,
    palladiumR.ok ? null : palladiumR.error,
    gasolineR.ok ? null : gasolineR.error,
    heatingOilR.ok ? null : heatingOilR.error,
    aluminumR.ok ? null : aluminumR.error,
    nickelR.ok ? null : nickelR.error,
    remxR.ok ? null : remxR.error,
    litR.ok ? null : litR.error,
    uraR.ok ? null : uraR.error,
    usdbrlR.ok ? null : usdbrlR.error,
    eurbrlR.ok ? null : eurbrlR.error,
    cnybrlR.ok ? null : cnybrlR.error,
    jpybrlR.ok ? null : jpybrlR.error,
    usdjpyR.ok ? null : usdjpyR.error,
    usdcnyR.ok ? null : usdcnyR.error,
    ibovR.ok ? null : ibovR.error,
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

  const stooqUsdBrl = usdbrlR.ok ? parseStooqCsvRow(usdbrlR.text) : null;
  const stooqEurBrl = eurbrlR.ok ? parseStooqCsvRow(eurbrlR.text) : null;
  const stooqCnyBrl = cnybrlR.ok ? parseStooqCsvRow(cnybrlR.text) : null;
  const stooqJpyBrl = jpybrlR.ok ? parseStooqCsvRow(jpybrlR.text) : null;
  const stooqUsdJpy = usdjpyR.ok ? parseStooqCsvRow(usdjpyR.text) : null;
  const stooqUsdCny = usdcnyR.ok ? parseStooqCsvRow(usdcnyR.text) : null;

  const usd_brl = stooqUsdBrl?.close ?? fx.rates?.BRL;
  const usd_eur = fx.rates?.EUR;
  const usd_cny = stooqUsdCny?.close ?? fx.rates?.CNY;
  const eur_brl = stooqEurBrl?.close ?? (usd_brl && usd_eur ? usd_brl / usd_eur : undefined);
  const cny_brl = stooqCnyBrl?.close ?? (usd_brl && usd_cny ? usd_brl / usd_cny : undefined);
  const jpy_brl = stooqJpyBrl?.close ?? undefined;
  const usd_jpy = stooqUsdJpy?.close ?? undefined;
  const usd_cny_fx = stooqUsdCny?.close ?? undefined;

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
  const silver_brl_oz = xag_usd != null && usd_brl != null ? xag_usd * usd_brl : undefined;
  const silver_brl_g = silver_brl_oz != null ? silver_brl_oz / 31.1034768 : undefined;

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

  const us2y = us2yR.ok ? parseFREDLastNumberFromCsv(us2yR.text) ?? undefined : undefined;
  const us10y = us10yR.ok ? parseFREDLastNumberFromCsv(us10yR.text) ?? undefined : undefined;
  const fed_funds = fedFundsR.ok ? parseFREDLastNumberFromCsv(fedFundsR.text) ?? undefined : undefined;
  const tips10y_real_yield = tips10yR.ok ? parseFREDLastNumberFromCsv(tips10yR.text) ?? undefined : undefined;
  const vix = vixR.ok ? vixR.data?.chart?.result?.[0]?.meta?.regularMarketPrice : undefined;

  const wti_usd_bbl = wtiR.ok ? parseStooqCsvRow(wtiR.text)?.close ?? undefined : undefined;
  const wti_brl_bbl = wti_usd_bbl != null && usd_brl != null ? wti_usd_bbl * usd_brl : undefined;
  const natgas_usd_mmbtu = natgasR.ok ? parseStooqCsvRow(natgasR.text)?.close ?? undefined : undefined;
  const copper_usd = copperR.ok ? parseStooqCsvRow(copperR.text)?.close ?? undefined : undefined;
  const wheat_usd = wheatR.ok ? parseStooqCsvRow(wheatR.text)?.close ?? undefined : undefined;
  const corn_usd = cornR.ok ? parseStooqCsvRow(cornR.text)?.close ?? undefined : undefined;
  const soy_usd = soyR.ok ? parseStooqCsvRow(soyR.text)?.close ?? undefined : undefined;
  const sugar_usd = sugarR.ok ? parseStooqCsvRow(sugarR.text)?.close ?? undefined : undefined;
  const coffee_usd = coffeeR.ok ? parseStooqCsvRow(coffeeR.text)?.close ?? undefined : undefined;
  const cotton_usd = cottonR.ok ? parseStooqCsvRow(cottonR.text)?.close ?? undefined : undefined;
  const platinum_usd_oz = platinumR.ok ? parseStooqCsvRow(platinumR.text)?.close ?? undefined : undefined;
  const palladium_usd_oz = palladiumR.ok ? parseStooqCsvRow(palladiumR.text)?.close ?? undefined : undefined;
  const gasoline_usd = gasolineR.ok ? parseStooqCsvRow(gasolineR.text)?.close ?? undefined : undefined;
  const heating_oil_usd = heatingOilR.ok ? parseStooqCsvRow(heatingOilR.text)?.close ?? undefined : undefined;
  const aluminum_usd = aluminumR.ok ? parseStooqCsvRow(aluminumR.text)?.close ?? undefined : undefined;
  const nickel_usd = nickelR.ok ? parseStooqCsvRow(nickelR.text)?.close ?? undefined : undefined;
  const etf_remx_usd = remxR.ok ? parseStooqCsvRow(remxR.text)?.close ?? undefined : undefined;
  const etf_lit_usd = litR.ok ? parseStooqCsvRow(litR.text)?.close ?? undefined : undefined;
  const etf_ura_usd = uraR.ok ? parseStooqCsvRow(uraR.text)?.close ?? undefined : undefined;

  const sge_cny_g = sgeR ?? undefined;

  const brazil_cds_5y_bps = cdsR ?? undefined;

  const ibov_index = ibovR.ok ? ibovR.data?.chart?.result?.[0]?.meta?.regularMarketPrice : undefined;

  const payload: MarketPayload = {
    fetchedAt: new Date().toISOString(),
    values: {
      usd_brl,
      eur_brl,
      cny_brl,
      jpy_brl,
      usd_jpy,
      usd_cny: usd_cny_fx,
      btc_brl,
      btc_usd,
      btc_dominance,

      xau_usd: xauUsdFinal,
      xag_usd,
      gold_silver_ratio,
      gold_brl_oz,
      gold_brl_g,
      silver_brl_oz,
      silver_brl_g,

      dxy,
      t10y2y,
      m2_usd_bil,

      us2y,
      us10y,
      fed_funds,
      tips10y_real_yield,
      vix,

      brl_selic_aa,
      brl_ipca_mom,
      brl_ipca_12m,
      brl_selic_real_simple,
      brl_selic_real_fisher,

      wti_usd_bbl,
      wti_brl_bbl,
      natgas_usd_mmbtu,
      copper_usd,
      wheat_usd,
      corn_usd,
      soy_usd,
      sugar_usd,
      coffee_usd,
      cotton_usd,
      platinum_usd_oz,
      palladium_usd_oz,
      gasoline_usd,
      heating_oil_usd,
      aluminum_usd,
      nickel_usd,
      etf_ura_usd,
      etf_lit_usd,
      etf_remx_usd,

      sge_cny_g,
      brazil_cds_5y_bps,
    },
    manual: {
      updatedAt: new Date().toISOString(),
      sge_cny_g,
      brazil_cds_5y_bps,
      ibov_index,
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
