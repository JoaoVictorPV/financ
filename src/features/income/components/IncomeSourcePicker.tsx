"use client";

import { useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/state/useAppStore";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#94a3b8"];

export default function IncomeSourcePicker({
  selectedId,
  onChange,
}: {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const sources = useAppStore((s) => s.incomeSources);
  const ensureIncomeSource = useAppStore((s) => s.ensureIncomeSource);
  const transactions = useAppStore((s) => s.transactions);

  const [q, setQ] = useState("");

  const usageRank = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.kind !== "income") continue;
      if (!tx.income_source_id) continue;
      counts.set(tx.income_source_id, (counts.get(tx.income_source_id) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const top = useMemo(() => {
    const sorted = [...sources].sort((a, b) => (usageRank.get(b.id) ?? 0) - (usageRank.get(a.id) ?? 0));
    return sorted.slice(0, 8);
  }, [sources, usageRank]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sources;
    return sources.filter((s) => s.name.toLowerCase().includes(needle));
  }, [q, sources]);

  const exactExists = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return sources.some((s) => s.name.trim().toLowerCase() === needle);
  }, [q, sources]);

  async function createFromQuery() {
    const name = q.trim();
    if (!name) return;
    const created = await ensureIncomeSource({
      name,
      color: COLORS[sources.length % COLORS.length]!,
    });
    onChange(created.id);
    setQ("");
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold">Fonte da entrada</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {top.map((s) => (
            <Chip
              key={s.id}
              type="button"
              active={selectedId === s.id}
              color={s.color}
              onClick={() => onChange(selectedId === s.id ? null : s.id)}
            >
              {s.name}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Input
          placeholder="Buscar ou criar fonte..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {!exactExists && q.trim() ? (
          <div className="mt-2">
            <Button size="md" variant="secondary" onClick={() => void createFromQuery()}>
              Criar fonte “{q.trim()}”
            </Button>
          </div>
        ) : null}
      </div>

      <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/10 p-2">
        {filtered.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => onChange(selectedId === s.id ? null : s.id)}
            className={
              "flex w-full items-center justify-between rounded-xl px-3 py-2 transition " +
              (selectedId === s.id ? "bg-white/10" : "hover:bg-white/5")
            }
          >
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-lg ring-1 ring-white/10"
                style={{ backgroundColor: s.color }}
              />
              <div className="text-sm font-semibold">{s.name}</div>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {selectedId === s.id ? "Selecionada" : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
