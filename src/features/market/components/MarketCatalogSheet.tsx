"use client";

import { useMemo, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Input from "@/components/ui/Input";
import type { MarketPayload } from "@/features/market/domain/types";
import { MARKET_GROUPS, MARKET_ITEMS, type MarketGroupId } from "@/features/market/domain/catalog";
import { formatValue } from "@/features/market/domain/format";

function HelpBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs font-semibold text-[var(--text)]">{title}</div>
      <div className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{text}</div>
    </div>
  );
}

export default function MarketCatalogSheet({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: MarketPayload | null;
}) {
  const [group, setGroup] = useState<MarketGroupId>("fx");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const values = data?.values;

  const groupItems = useMemo(() => {
    const byGroup = MARKET_ITEMS.filter((it) => it.group === group);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? byGroup.filter((it) => it.label.toLowerCase().includes(q) || (it.badge ?? "").toLowerCase().includes(q))
      : byGroup;

    // mostra primeiro os que já têm valor (melhora percepção)
    if (!values) return filtered;
    return [...filtered].sort((a, b) => {
      const av = typeof values[a.id] === "number";
      const bv = typeof values[b.id] === "number";
      return Number(bv) - Number(av);
    });
  }, [group, query, values]);

  const currentGroup = MARKET_GROUPS.find((g) => g.id === group);

  return (
    <BottomSheet open={open} onClose={onClose} title="Índices de Mercado">
      <div className="space-y-4">
        <Card className="space-y-3">
          <div className="text-sm font-semibold">Explorar por categoria</div>
          <div className="flex flex-wrap gap-2">
            {MARKET_GROUPS.filter((g) => g.id !== "overview").map((g) => (
              <Chip
                key={g.id}
                active={group === g.id}
                color={g.color}
                onClick={() => {
                  setGroup(g.id);
                  setExpanded(null);
                }}
              >
                {g.title}
              </Chip>
            ))}
          </div>
          <div className="text-xs text-[var(--muted)]">{currentGroup?.subtitle}</div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar (ex.: dólar, petróleo, risco...)"
          />
        </Card>

        <div className="grid grid-cols-2 gap-2">
          {groupItems.map((it) => {
            const isOpen = expanded === it.id;
            const val = values ? formatValue(it.id, values, { precision: it.precision, unit: it.unit }) : "—";

            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setExpanded(isOpen ? null : it.id)}
                className={
                  "rounded-2xl border border-white/10 bg-black/10 p-3 text-left transition " +
                  (isOpen ? "ring-1 ring-white/15" : "hover:bg-white/5")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold leading-snug">{it.label}</div>
                    {it.badge ? (
                      <div className="mt-1 inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted)]">
                        {it.badge}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold">{val}</div>
                    <div className="mt-1 inline-flex rounded-xl border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-[var(--muted)]">
                      {isOpen ? "Fechar" : "Entender"}
                    </div>
                  </div>
                </div>

                {isOpen ? (
                  <div className="mt-3 space-y-2">
                    <HelpBlock title="O que é" text={it.help.oQueE} />
                    <HelpBlock title="Por que importa" text={it.help.porQueImporta} />
                    <HelpBlock title="Como interpretar" text={it.help.comoLer} />

                    {it.help.thresholds?.length ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold">Faixas e alertas</div>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                          {it.help.thresholds.map((t) => (
                            <li key={t.when}>
                              <b className="text-[var(--text)]">{t.when}:</b> {t.meaning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {it.help.exemplos?.length ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold">Exemplos práticos</div>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                          {it.help.exemplos.map((t, idx) => (
                            <li key={idx}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
