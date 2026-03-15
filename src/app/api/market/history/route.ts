import { NextResponse } from "next/server";
import type { MarketHistoryPayload, MarketHistorySeries } from "@/features/market/domain/types";

export const revalidate = 3600; // cache do Next (1h)

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
let CACHE: Record<string, MarketHistoryPayload> = {};
let CACHE_AT: Record<string, number> = {};

type RangeKey = "3mo" | "6mo" | "1y" | "5y";

function normalizeRange(raw: string | null): RangeKey {
  if (raw === "3mo" || raw === "6mo" || raw === "1y" || raw === "5y") return raw;
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
  const seriesDefs: Array<{ id: string; label: string; unit: string; symbol: string }> = [
    { id: "usd_brl", label: "USD/BRL", unit: "BRL", symbol: "BRL=X" },
    { id: "eur_brl", label: "EUR/BRL", unit: "BRL", symbol: "EURBRL=X" },
    { id: "cny_brl", label: "CNY/BRL", unit: "BRL", symbol: "CNYBRL=X" },
    { id: "btc_usd", label: "Bitcoin", unit: "USD", symbol: "BTC-USD" },
    { id: "eth_usd", label: "Ethereum", unit: "USD", symbol: "ETH-USD" },
    { id: "gold_usd", label: "Ouro", unit: "USD/oz", symbol: "XAUUSD=X" },
    { id: "silver_usd", label: "Prata", unit: "USD/oz", symbol: "XAGUSD=X" },
    { id: "oil", label: "Petróleo (WTI)", unit: "USD/bbl", symbol: "CL=F" },
    { id: "sp500", label: "S&P 500", unit: "pts", symbol: "^GSPC" },
    { id: "nasdaq100", label: "Nasdaq 100", unit: "pts", symbol: "^NDX" },
    { id: "dowj", label: "Dow Jones", unit: "pts", symbol: "^DJI" },
    { id: "ibov", label: "Ibovespa", unit: "pts", symbol: "^BVSP" },
  ];

  const errors: string[] = [];
  const series: MarketHistorySeries[] = [];

  for (const def of seriesDefs) {
    try {
      const points = await fetchYahooSeries(def.symbol, range);
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
