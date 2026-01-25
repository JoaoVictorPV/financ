"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import TagPicker from "@/components/tags/TagPicker";
import Switch from "@/components/ui/Switch";
import { useAppStore } from "@/state/useAppStore";
import { parseBRLToCents, formatBRLFromCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";
import type { RecurringFrequency, TransactionKind } from "@/lib/domain/types";

export default function RecurringManager() {
  const templates = useAppStore((s) => s.recurringTemplates);
  const addRecurringTemplate = useAppStore((s) => s.addRecurringTemplate);
  const updateRecurringTemplate = useAppStore((s) => s.updateRecurringTemplate);
  const deleteRecurringTemplate = useAppStore((s) => s.deleteRecurringTemplate);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [kind, setKind] = useState<TransactionKind>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [monthlyLastBusinessDay, setMonthlyLastBusinessDay] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startDate, setStartDate] = useState(todayYMD());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...templates].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [templates],
  );

  function resetForm() {
    setEditingId(null);
    setKind("expense");
    setAmount("");
    setDescription("");
    setTags([]);
    setFrequency("monthly");
    setDayOfMonth("5");
    setMonthlyLastBusinessDay(false);
    setDayOfWeek("1");
    setStartDate(todayYMD());
    setEndDate("");
    setError(null);
  }

  function openNew() {
    resetForm();
    setOpen(true);
  }

  function openEdit(id: string) {
    const rt = templates.find((t) => t.id === id);
    if (!rt) return;

    setEditingId(id);
    setKind(rt.kind);
    setAmount(formatBRLFromCents(rt.amount_cents));
    setDescription(rt.description);
    setTags(rt.tags);
    setFrequency(rt.frequency);
    setDayOfMonth(String(rt.day_of_month ?? 5));
    setMonthlyLastBusinessDay(rt.monthly_rule === "lastBusinessDay");
    setDayOfWeek(String(rt.day_of_week ?? 1));
    setStartDate(rt.start_date);
    setEndDate(rt.end_date ?? "");
    setError(null);
    setOpen(true);
  }

  async function onSave() {
    setError(null);
    const cents = parseBRLToCents(amount);
    if (!cents || cents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!description.trim()) {
      setError("Informe uma descrição.");
      return;
    }
    if (!startDate) {
      setError("Informe a data de início.");
      return;
    }

    const payload = {
      kind,
      amount_cents: cents,
      currency: "BRL" as const,
      description,
      tags,
      frequency,
      day_of_month:
        frequency === "monthly" && !monthlyLastBusinessDay
          ? Math.min(28, Math.max(1, Number(dayOfMonth) || 1))
          : null,
      monthly_rule:
        frequency === "monthly"
          ? monthlyLastBusinessDay
            ? ("lastBusinessDay" as const)
            : ("dayOfMonth" as const)
          : null,
      day_of_week:
        frequency === "weekly"
          ? Math.min(6, Math.max(0, Number(dayOfWeek) || 0))
          : null,
      start_date: startDate,
      end_date: endDate.trim() || null,
    };

    if (!editingId) {
      await addRecurringTemplate(payload);
    } else {
      await updateRecurringTemplate(editingId, payload);
    }

    setOpen(false);
    resetForm();
  }

  async function onDelete() {
    if (!editingId) return;
    await deleteRecurringTemplate(editingId);
    setOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-3">
      <Button onClick={openNew}>Nova recorrência</Button>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">Modelos</div>
          <div className="text-sm text-[var(--muted)]">{sorted.length}</div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">Nenhuma recorrência ainda.</div>
        ) : (
          <div className="space-y-2">
            {sorted.map((rt) => (
              <button
                key={rt.id}
                onClick={() => openEdit(rt.id)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-left"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {rt.description}
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      {rt.kind === "expense" ? "despesa" : "entrada"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {rt.frequency} • início {rt.start_date}
                    {rt.end_date ? ` • fim ${rt.end_date}` : ""}
                  </div>
                </div>
                <div className="text-sm font-bold">{formatBRLFromCents(rt.amount_cents)}</div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editingId ? "Editar recorrência" : "Nova recorrência"}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="md"
              variant={kind === "expense" ? "primary" : "secondary"}
              onClick={() => setKind("expense")}
            >
              Despesa
            </Button>
            <Button
              size="md"
              variant={kind === "income" ? "primary" : "secondary"}
              onClick={() => setKind("income")}
            >
              Entrada
            </Button>
          </div>

          <div>
            <div className="text-sm font-semibold">Valor</div>
            <div className="mt-2">
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Descrição</div>
            <div className="mt-2">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Academia" />
            </div>
          </div>

          <TagPicker selected={tags} onChange={setTags} />

          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-sm font-semibold">Frequência</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["monthly", "weekly", "yearly"] as RecurringFrequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={
                    "rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold " +
                    (frequency === f ? "bg-[var(--primary)] text-black" : "bg-black/10")
                  }
                >
                  {f === "monthly" ? "Mensal" : f === "weekly" ? "Semanal" : "Anual"}
                </button>
              ))}
            </div>

            {frequency === "monthly" ? (
              <div className="mt-3 space-y-2">
                <Switch
                  checked={monthlyLastBusinessDay}
                  onChange={setMonthlyLastBusinessDay}
                  label="Último dia útil do mês"
                />
                {!monthlyLastBusinessDay ? (
                  <div>
                    <div className="text-sm font-semibold">Dia do mês (1–28)</div>
                    <div className="mt-2">
                      <Input inputMode="numeric" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {frequency === "weekly" ? (
              <div className="mt-3">
                <div className="text-sm font-semibold">Dia da semana (0=Dom … 6=Sáb)</div>
                <div className="mt-2">
                  <Input inputMode="numeric" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} />
                </div>
              </div>
            ) : null}

            {frequency === "yearly" ? (
              <div className="mt-3 text-xs text-[var(--muted)]">
                Anual usa o dia/mês da data de início (start_date).
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold">Início</div>
              <div className="mt-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">Fim (opcional)</div>
              <div className="mt-2">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

          <div className={editingId ? "grid grid-cols-2 gap-3" : ""}>
            <Button onClick={() => void onSave()}>{editingId ? "Salvar" : "Criar"}</Button>
            {editingId ? (
              <Button variant="danger" onClick={() => void onDelete()}>
                Apagar
              </Button>
            ) : null}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
