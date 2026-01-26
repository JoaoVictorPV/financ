"use client";

import { useMemo, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import TagPicker from "@/components/tags/TagPicker";
import IncomeSourcePicker from "@/features/income/components/IncomeSourcePicker";
import { parseBRLToCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";
import { useAppStore } from "@/state/useAppStore";
import type { TransactionKind } from "@/lib/domain/types";

export default function TransactionFormSheet({
  open,
  onClose,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  kind: TransactionKind;
}) {
  const addTransaction = useAppStore((s) => s.addTransaction);
  const addIncome = useAppStore((s) => s.addIncome);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYMD());
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [incomeSourceId, setIncomeSourceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = kind === "expense" ? "Nova despesa" : "Nova entrada";

  const amountCents = useMemo(() => parseBRLToCents(amount), [amount]);

  async function onSave() {
    setError(null);
    if (!amountCents || amountCents <= 0) {
      setError("Informe um valor válido.");
      return;
    }

    if (kind === "income") {
      // Entradas usam o sistema próprio de fontes (tags de renda)
      // A descrição vira a fonte automaticamente (regra do usuário).
      await addIncome({
        amount_cents: amountCents,
        date,
        description,
        income_source_id: incomeSourceId,
      });
    } else {
      await addTransaction({
        kind,
        amount_cents: amountCents,
        date,
        description,
        tags,
        // IMPORTANTE: este modal é APENAS para despesa normal.
        // Recorrências e cartão têm modais específicos (Home).
        is_recurring: false,
        credit_card_id: null,
      });
    }

    setAmount("");
    setDescription("");
    setTags([]);
    setIncomeSourceId(null);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        {kind === "income" ? (
          <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-[var(--muted)]">
            <div className="font-semibold text-[var(--text)]">Como funciona a fonte da entrada</div>
            <div className="mt-1">
              Selecione uma <b>Fonte</b> (ex: Salário, Freelance) ou digite uma nova.
              Essa fonte é usada nos gráficos de entradas.
            </div>
          </div>
        ) : null}

        <div>
          <div className="text-sm font-semibold">Valor</div>
          <div className="mt-2">
            <Input
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Data</div>
          <div className="mt-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">
            {kind === "income" ? "Descrição / Fonte (opcional)" : "Descrição (opcional)"}
          </div>
          <div className="mt-2">
            <Input
              placeholder={kind === "income" ? "Ex: Salário, Freelance..." : "Ex: almoço, mercado..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {kind === "income" ? (
          <IncomeSourcePicker selectedId={incomeSourceId} onChange={setIncomeSourceId} />
        ) : (
          <TagPicker selected={tags} onChange={setTags} />
        )}

        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

        <Button onClick={() => void onSave()}>Salvar</Button>
      </div>
    </BottomSheet>
  );
}
