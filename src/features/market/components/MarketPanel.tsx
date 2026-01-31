"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { MarketPayload } from "@/features/market/domain/types";
import MarketCatalogExplorer from "@/features/market/components/MarketCatalogExplorer";

export default function MarketPanel() {
  const [data, setData] = useState<MarketPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // carrega cache local instantaneamente para não ficar "vazio" enquanto a API busca dados
  useEffect(() => {
    try {
      const raw = localStorage.getItem("finSys.market.cache");
      if (raw) {
        const json = JSON.parse(raw) as MarketPayload;
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  async function load() {
    try {
      // não limpa UI inteira; só mostra loading no botão
      setLoading(true);
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Falha ao carregar índices (HTTP ${res.status}). ${txt.slice(0, 140)}`);
      }
      const json = (await res.json()) as MarketPayload;
      setData(json);

      try {
        localStorage.setItem("finSys.market.cache", JSON.stringify(json));
      } catch {
        // ignore
      }

      // Evita flood de mensagens. Mostra apenas aviso curto e não em vermelho (a UI trata)
      setError(json.meta?.stale ? (json.meta?.note ?? "Dados em cache") : null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar índices";
      // se já temos algo carregado, não exibe erro agressivo.
      if (!data) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const showSkeleton = hydrated && !data;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">Índices de Mercado</div>
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

      {error ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--muted)]">
          {error}
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="mt-2 h-4 w-24 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : null}

      {/* A exploração por categorias agora fica DIRETO na página */}
      <MarketCatalogExplorer data={data} defaultGroup="overview" title="Explorar por categorias" />
    </Card>
  );
}
