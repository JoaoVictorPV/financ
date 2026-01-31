import { NextResponse } from "next/server";
import type { MarketHistoryPayload, MarketHistorySeries } from "@/features/market/domain/types";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas
let CACHE: MarketHistoryPayload | null = null;
let CACHE_AT = 0;

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Fin.SYS" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(id);
  }
}

function parseStooqDaily(csv: string): Array<[string, number]> {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const out: Array<[string, number]> = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(",");
    if (parts.length < 5) continue;
    const date = parts[0];
    const close = Number(parts[4]);
    if (!date || !Number.isFinite(close)) continue;
    out.push([date, close]);
  }
  return out;
}

function last6Months(points: Array<[string, number]>): Array<[string, number]> {
  if (!points.length) return [];
  const end = new Date(points[points.length - 1]![0]);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  return points.filter(([d]) => new Date(d) >= start);
}

export async function GET() {
  const now = Date.now();
  if (CACHE && now - CACHE_AT < CACHE_TTL_MS) {
    return NextResponse.json(CACHE);
  }

  const seriesDefs: Array<{ id: string; label: string; unit: string; stooq: string }> = [
    { id: "usd_brl", label: "USD/BRL", unit: "BRL", stooq: "usdbrl" },
    { id: "eur_brl", label: "EUR/BRL", unit: "BRL", stooq: "eurbrl" },
    { id: "cny_brl", label: "CNY/BRL", unit: "BRL", stooq: "cnybrl" },
    { id: "jpy_brl", label: "JPY/BRL", unit: "BRL", stooq: "jpybrl" },
    { id: "btc_usd", label: "Bitcoin", unit: "USD", stooq: "btcusd" },
    { id: "gold_usd", label: "Ouro", unit: "USD/oz", stooq: "xauusd" },
    { id: "silver_usd", label: "Prata", unit: "USD/oz", stooq: "xagusd" },
    { id: "oil", label: "Petróleo (WTI)", unit: "USD/bbl", stooq: "cl.f" },
    { id: "nasdaq", label: "Nasdaq 100", unit: "pts", stooq: "^ndx" },
    { id: "dowj", label: "Dow Jones", unit: "pts", stooq: "^dji" },
    { id: "shanghai", label: "Bolsa Xangai", unit: "pts", stooq: "^shc" },
    { id: "tokyo", label: "Bolsa Tóquio", unit: "pts", stooq: "^nkx" },
  ];

  const errors: string[] = [];
  const series: MarketHistorySeries[] = [];

  for (const def of seriesDefs) {
    try {
      const csv = await fetchText(`https://stooq.com/q/d/l/?s=${def.stooq}&i=d`);
      const points = last6Months(parseStooqDaily(csv));
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

  CACHE = payload;
  CACHE_AT = now;

  return NextResponse.json(payload);
}