"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/state/useAppStore";
import { formatBRLFromCents } from "@/lib/money";
import { formatYMDToBR } from "@/lib/dates";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Switch from "@/components/ui/Switch";
import TagPicker from "@/components/tags/TagPicker";
import { parseBRLToCents } from "@/lib/money";
import type { Transaction } from "@/lib/domain/types";

function lastNDaysYMD(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function TransactionsWeekTable() {
  const transactions = useAppStore((s) => s.transactions);
  const tags = useAppStore((s) => s.tags);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rec, setRec] = useState(false);

  const weekStart = useMemo(() => lastNDaysYMD(7), []);

  const items = useMemo(() => {
    return transactions
      .filter((t) => t.kind === "expense")
      .filter((t) => t.date >= weekStart)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, weekStart]);

  function tagNames(ids: string[]) {
    const map = new Map(tags.map((t) => [t.id, t.name]));
    return ids.map((id) => map.get(id)).filter(Boolean).join(", ");
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setAmount(formatBRLFromCents(tx.amount_cents));
    setDate(tx.date);
    setDescription(tx.description);
    setSelectedTags(tx.tags);
    setRec(tx.is_recurring);
  }

  async function onSaveEdit() {
    if (!editing) return;
    const cents = parseBRLToCents(amount);
    if (!cents || cents <= 0) return;
    await updateTransaction(editing.id, {
      amount_cents: cents,
      date,
      description,
      tags: selectedTags,
      is_recurring: rec,
    });
    setEditing(null);
  }

  async function onDelete() {
    if (!editing) return;
    await deleteTransaction(editing.id);
    setEditing(null);
  }

  return (
    <>
      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-base font-semibold">Gastos da semana</div>
            <div className="text-xs text-[var(--muted)]">Últimos 7 dias</div>
          </div>
          <div className="text-sm text-[var(--muted)]">{items.length} itens</div>
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">Sem gastos na semana.</div>
          ) : (
            items.map((t) => (
              <button
                key={t.id}
                onClick={() => openEdit(t)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-left"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {t.description || "(sem descrição)"}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {formatYMDToBR(t.date)}
                    {t.tags.length ? ` • ${tagNames(t.tags)}` : ""}
                  </div>
                </div>
                <div className="text-sm font-bold">{formatBRLFromCents(t.amount_cents)}</div>
              </button>
            ))
          )}
        </div>
      </Card>

      <BottomSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar transação"
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">Valor</div>
            <div className="mt-2">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Data</div>
            <div className="mt-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Descrição</div>
            <div className="mt-2">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <TagPicker selected={selectedTags} onChange={setSelectedTags} />
          <Switch checked={rec} onChange={setRec} label="Recorrente" />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => void onSaveEdit()}>
              Salvar
            </Button>
            <Button variant="danger" onClick={() => void onDelete()}>
              Apagar
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
