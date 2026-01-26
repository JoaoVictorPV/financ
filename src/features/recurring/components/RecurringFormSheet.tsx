"use client";

import { useMemo, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import TagPicker from "@/components/tags/TagPicker";
import { parseBRLToCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";
import { useAppStore } from "@/state/useAppStore";

export default function RecurringFormSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addRecurringTemplate = useAppStore((s) => s.addRecurringTemplate);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [dueDay, setDueDay] = useState("");
  const [monthlyLastBusinessDay, setMonthlyLastBusinessDay] = useState(false);
  const [startDate, setStartDate] = useState(todayYMD());
  const [error, setError] = useState<string | null>(null);

  const amountCents = useMemo(() => parseBRLToCents(amount), [amount]);

  async function onSave() {
    setError(null);
    if (!amountCents || amountCents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!description.trim()) {
      setError("Informe uma descrição.");
      return;
    }

    await addRecurringTemplate({
      kind: "expense",
      amount_cents: amountCents,
      currency: "BRL",
      description,
      tags,
      frequency: "monthly",
      day_of_month:
        !monthlyLastBusinessDay ? Math.min(28, Math.max(1, Number(dayOfMonth) || 1)) : null,
      monthly_rule: monthlyLastBusinessDay ? "lastBusinessDay" : "dayOfMonth",
      day_of_week: null,
      due_day_of_month: dueDay.trim() ? Math.min(31, Math.max(1, Number(dueDay) || 1)) : null,
      start_date: startDate,
      end_date: null,
    });

    setAmount("");
    setDescription("");
    setTags([]);
    setDayOfMonth("5");
    setDueDay("");
    setMonthlyLastBusinessDay(false);
    setStartDate(todayYMD());
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Nova despesa recorrente">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-[var(--muted)]">
          Ao salvar, o app cria automaticamente uma tag <b>R - {"<descrição>"}</b>.
          No calendário, o lembrete some quando você registrar o pagamento do mês com essa tag.
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
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Aluguel" />
          </div>
        </div>

        <TagPicker selected={tags} onChange={setTags} />

        <div className="rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="text-sm font-semibold">Regra mensal</div>
          <div className="mt-2 space-y-2">
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

            <div>
              <div className="text-sm font-semibold">Vencimento (opcional)</div>
              <div className="mt-2">
                <Input inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Ex: 10" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Início</div>
          <div className="mt-2">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

        <Button onClick={() => void onSave()}>Criar recorrente</Button>
      </div>
    </BottomSheet>
  );
}
