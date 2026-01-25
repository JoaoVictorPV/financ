import { NextResponse } from "next/server";
import type { MarketPayload } from "@/features/market/domain/types";

export const revalidate = 300; // 5 minutos (cache do Next)

// Cache em memória (funciona bem no dev e geralmente no serverless quente)
let CACHE: MarketPayload | null = null;
let CACHE_AT = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

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
    bitcoin?: { brl?: number };
    "tether-gold"?: { usd?: number };
  };
  type BcbSgsRow = { data: string; valor: string };

  type ErApi = { rates: Record<string, number>; time_last_update_unix?: number };

  const [fxR, cryptoR, selicR] = await Promise.all([
    safeFetch<ErApi>("fx", "https://open.er-api.com/v6/latest/USD"),
    safeFetch<CoinGeckoSimplePrice>(
      "crypto",
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether-gold&vs_currencies=brl,usd",
    ),
    safeFetch<BcbSgsRow[]>(
      "selic",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/10?formato=json",
    ),
  ]);

  const warnings = [
    fxR.ok ? null : fxR.error,
    cryptoR.ok ? null : cryptoR.error,
    selicR.ok ? null : selicR.error,
  ].filter(Boolean);

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

  const usd_brl = fx.rates?.BRL;
  const usd_eur = fx.rates?.EUR;
  const usd_cny = fx.rates?.CNY;
  const eur_brl = usd_brl && usd_eur ? usd_brl / usd_eur : undefined;
  const cny_brl = usd_brl && usd_cny ? usd_brl / usd_cny : undefined;

  const btc_brl = crypto.bitcoin?.brl;

  // ouro em USD (proxy: tether-gold USD)
  const gold_usd = crypto["tether-gold"]?.usd;
  const gold_brl = gold_usd != null && usd_brl != null ? gold_usd * usd_brl : undefined;

  const lastSelic = selic?.[selic.length - 1];
  const brl_selic = lastSelic?.valor != null
    ? Number(String(lastSelic.valor).replace(",", ".")) / 100
    : undefined;

  const payload: MarketPayload = {
    fetchedAt: new Date().toISOString(),
    values: {
      usd_brl,
      eur_brl,
      cny_brl,
      btc_brl,
      brl_selic,
      gold_usd,
      gold_brl,
    },
    source: {
      fx: "open.er-api.com",
      crypto: "coingecko",
      selic: "bcb-sgs-432",
    },
    meta: warnings.length ? { stale: false, note: warnings.join(" | ") } : { stale: false },
  };

  CACHE = payload;
  CACHE_AT = now;

  return NextResponse.json(payload);
}
