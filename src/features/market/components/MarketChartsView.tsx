"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Input from "@/components/ui/Input";
import EChart from "@/features/insights/components/internal/EChart";
import type { MarketHistoryPayload } from "@/features/market/domain/types";

function formatNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export default function MarketChartsView() {
  const [data, setData] = useState<MarketHistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"3mo" | "6mo" | "1y" | "5y">("6mo");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/market/history?range=${range}`, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Falha ao carregar gráficos (HTTP ${res.status}). ${txt.slice(0, 140)}`);
      }
      const json = (await res.json()) as MarketHistoryPayload;
      setData(json);
      if (json.meta?.note) setError(json.meta.note);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar gráficos";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [range]);

  const charts = useMemo(() => {
    if (!data?.series) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.series.filter((s) => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
      : data.series;

    return filtered.map((s) => {
      const x = s.points.map((p) => p[0]);
      const y = s.points.map((p) => p[1]);
      const last = y[y.length - 1];

      return {
        id: s.id,
        title: s.label,
        subtitle: last != null ? `${formatNumber(last, 2)} ${s.unit}` : "—",
        option: {
          backgroundColor: "transparent",
          grid: { left: 12, right: 12, top: 24, bottom: 24, containLabel: true },
          xAxis: {
            type: "category" as const,
            data: x,
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            axisLine: { lineStyle: { color: "rgba(148,163,184,0.3)" } },
          },
          yAxis: {
            type: "value" as const,
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
          },
          tooltip: {
            trigger: "axis" as const,
            backgroundColor: "rgba(15,23,42,0.95)",
            borderColor: "rgba(148,163,184,0.2)",
            textStyle: { color: "#e2e8f0" },
          },
          series: [
            {
              type: "line" as const,
              data: y,
              smooth: true,
              showSymbol: false,
              lineStyle: { width: 2, color: "#38bdf8" },
              areaStyle: { color: "rgba(56,189,248,0.15)" },
            },
          ],
        },
      };
    });
  }, [data, query]);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">Gráficos de Mercado</div>
            <div className="mt-1 text-xs text-[var(--muted)]">Auto-update em 10 min</div>
          </div>
          <div className="w-28">
            <Button size="md" variant="secondary" onClick={() => void load()} disabled={loading}>
              {loading ? "..." : "Atualizar"}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {([
            { id: "3mo", label: "3m" },
            { id: "6mo", label: "6m" },
            { id: "1y", label: "1a" },
            { id: "5y", label: "5a" },
          ] as const).map((r) => (
            <Chip key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>

        <div className="mt-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar gráfico (ex.: petróleo, ouro, dólar, ibov...)"
          />
        </div>
        {error ? <div className="text-xs text-[var(--danger)]">{error}</div> : null}
      </Card>

      <div className="space-y-4">
        {charts.map((c) => (
          <Card key={c.id} className="space-y-3">
            <div>
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="text-xs text-[var(--muted)]">{c.subtitle}</div>
            </div>
            <div className="h-40">
              <EChart option={c.option} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}