"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { MarketPayload } from "@/features/market/domain/types";

function formatNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export default function MarketPanel() {
  const [data, setData] = useState<MarketPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Falha ao carregar índices (HTTP ${res.status}). ${txt.slice(0, 140)}`);
      }
      const json = (await res.json()) as MarketPayload;
      setData(json);
      if (json.meta?.note) {
        setError(json.meta.note);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar índices";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => {
    const v = data?.values;
    const goldOz = v?.gold_brl_oz;
    const goldG = v?.gold_brl_g ?? (goldOz != null ? goldOz / 31.1034768 : null); // 1 onça troy = 31.1034768g
    return [
      {
        label: "USD/BRL",
        value: v?.usd_brl != null ? `R$ ${formatNumber(v.usd_brl, 3)}` : "—",
      },
      {
        label: "EUR/BRL",
        value: v?.eur_brl != null ? `R$ ${formatNumber(v.eur_brl, 3)}` : "—",
      },
      {
        label: "CNY/BRL",
        value: v?.cny_brl != null ? `R$ ${formatNumber(v.cny_brl, 3)}` : "—",
      },
      {
        label: "BTC/BRL",
        value: v?.btc_brl != null ? `R$ ${formatNumber(v.btc_brl, 0)}` : "—",
      },
      {
        label: "BTC/USD",
        value: v?.btc_usd != null ? `US$ ${formatNumber(v.btc_usd, 0)}` : "—",
      },
      {
        label: "SELIC",
        value: v?.brl_selic_aa != null ? `${formatNumber(v.brl_selic_aa * 100, 2)}% a.a.` : "—",
      },
      {
        label: "Ouro (BRL)",
        value:
          goldOz != null
            ? `R$ ${formatNumber(goldOz, 2)} / oz (R$ ${formatNumber(goldG ?? 0, 2)} / g)`
            : "—",
      },
    ];
  }, [data]);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">Índices (Top 6)</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Atualiza automaticamente (10 min). {data?.fetchedAt ? `Último: ${data.fetchedAt}` : ""}
          </div>
        </div>
        <div className="w-32">
          <Button size="md" variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? "..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">{it.label}</div>
            <div className="mt-1 text-sm font-bold">{it.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
