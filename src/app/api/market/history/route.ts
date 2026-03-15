import { NextResponse } from "next/server";
import type { MarketHistoryPayload, MarketHistorySeries } from "@/features/market/domain/types";

export const revalidate = 3600; // cache do Next (1h)

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
let CACHE: Record<string, MarketHistoryPayload> = {};
let CACHE_AT: Record<string, number> = {};

type RangeKey = "3mo" | "6mo" | "1y" | "5y" | "10y" | "max";

function normalizeRange(raw: string | null): RangeKey {
  if (raw === "3mo" || raw === "6mo" || raw === "1y" || raw === "5y" || raw === "10y" || raw === "max") return raw;
  return "6mo";
}

type YahooChartResp = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: unknown;
  };
};

async function fetchYahooSeries(symbol: string, range: RangeKey): Promise<Array<[string, number]>> {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Fin.SYS" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);
  const json = (await res.json()) as YahooChartResp;
  const r = json.chart?.result?.[0];
  if (!r?.timestamp?.length) return [];
  const closes = r.indicators?.quote?.[0]?.close ?? [];

  const out: Array<[string, number]> = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    const ts = r.timestamp[i];
    const close = closes[i];
    if (!ts || close == null) continue;
    const d = new Date(ts * 1000);
    // YYYY-MM-DD
    const ymd = d.toISOString().slice(0, 10);
    out.push([ymd, close]);
  }
  return out;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = normalizeRange(url.searchParams.get("range"));

  const now = Date.now();
  if (CACHE[range] && now - (CACHE_AT[range] ?? 0) < CACHE_TTL_MS) {
    return NextResponse.json(CACHE[range]);
  }

  // Definições de séries (Yahoo)
  // Organizado por blocos para ficar intuitivo na UI.
  const seriesDefs: Array<{ id: string; label: string; unit: string; symbol: string }> = [
    // Câmbio
    { id: "usd_brl", label: "USD/BRL", unit: "BRL", symbol: "BRL=X" },
    { id: "eur_brl", label: "EUR/BRL", unit: "BRL", symbol: "EURBRL=X" },
    { id: "cny_brl", label: "CNY/BRL", unit: "BRL", symbol: "CNYBRL=X" },

    // Cripto
    { id: "btc_usd", label: "Bitcoin", unit: "USD", symbol: "BTC-USD" },
    { id: "eth_usd", label: "Ethereum", unit: "USD", symbol: "ETH-USD" },
    { id: "sol_usd", label: "Solana", unit: "USD", symbol: "SOL-USD" },

    // Commodities
    { id: "gold_usd", label: "Ouro", unit: "USD/oz", symbol: "XAUUSD=X" },
    { id: "silver_usd", label: "Prata", unit: "USD/oz", symbol: "XAGUSD=X" },
    { id: "oil", label: "Petróleo (WTI)", unit: "USD/bbl", symbol: "CL=F" },
    { id: "soy", label: "Soja (futuro)", unit: "USD", symbol: "ZS=F" },

    // Bolsas / índices
    { id: "sp500", label: "S&P 500", unit: "pts", symbol: "^GSPC" },
    { id: "nasdaq100", label: "Nasdaq 100", unit: "pts", symbol: "^NDX" },
    { id: "dowj", label: "Dow Jones", unit: "pts", symbol: "^DJI" },
    { id: "ibov", label: "Ibovespa", unit: "pts", symbol: "^BVSP" },
    { id: "nikkei", label: "Nikkei 225", unit: "pts", symbol: "^N225" },
    { id: "ftse", label: "FTSE 100", unit: "pts", symbol: "^FTSE" },
    { id: "stoxx", label: "Euro Stoxx 50", unit: "pts", symbol: "^STOXX50E" },
    { id: "shanghai", label: "Shanghai Composite", unit: "pts", symbol: "000001.SS" },
    { id: "ifix", label: "IFIX (FIIs)", unit: "pts", symbol: "IFIX.SA" },

    // ETFs / proxies
    { id: "remx", label: "Terras Raras (REMX)", unit: "USD", symbol: "REMX" },
  ];

  const errors: string[] = [];
  const series: MarketHistorySeries[] = [];

  for (const def of seriesDefs) {
    try {
      // O Yahoo tem instabilidade em alguns pares (ex.: CNYBRL=X)
      // Se vier com poucos pontos, calculamos CNY/BRL = (USD/BRL) / (USD/CNY)
      let points = await fetchYahooSeries(def.symbol, range);
      if (def.id === "cny_brl" && points.length < 10) {
        const usdbrl = await fetchYahooSeries("BRL=X", range);
        const usdcny = await fetchYahooSeries("USDCNY=X", range);
        const byDate = new Map<string, { usdbrl?: number; usdcny?: number }>();
        for (const [d, v] of usdbrl) byDate.set(d, { ...(byDate.get(d) ?? {}), usdbrl: v });
        for (const [d, v] of usdcny) byDate.set(d, { ...(byDate.get(d) ?? {}), usdcny: v });
        points = Array.from(byDate.entries())
          .map(([d, o]) => {
            const a = o.usdbrl;
            const b = o.usdcny;
            if (a == null || b == null || b === 0) return null;
            return [d, a / b] as [string, number];
          })
          .filter((x): x is [string, number] => Boolean(x))
          .sort((a, b) => a[0].localeCompare(b[0]));
      }
      series.push({ id: def.id, label: def.label, unit: def.unit, points });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${def.id}: ${msg}`);
    }
  }

  const payload: MarketHistoryPayload = {
    fetchedAt: new Date().toISOString(),
    series,
    meta: errors.length ? { note: "Alguns gráficos falharam", errors } : undefined,
  };

  CACHE[range] = payload;
  CACHE_AT[range] = now;

  return NextResponse.json(payload);
}
