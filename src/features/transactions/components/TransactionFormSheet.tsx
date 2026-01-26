"use client";

import { useMemo, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
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
  const creditCards = useAppStore((s) => s.creditCards);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYMD());
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [incomeSourceId, setIncomeSourceId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [useCard, setUseCard] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = kind === "expense" ? "Nova despesa" : "Nova entrada";

  const amountCents = useMemo(() => parseBRLToCents(amount), [amount]);

  async function onSave() {
    setError(null);
    if (!amountCents || amountCents <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (useCard && !cardId) {
      setError("Selecione um cartão.");
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
        is_recurring: isRecurring,
        credit_card_id: useCard ? cardId : null,
      });
    }

    setAmount("");
    setDescription("");
    setTags([]);
    setIncomeSourceId(null);
    setIsRecurring(false);
    setUseCard(false);
    setCardId(null);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
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
          <div className="text-sm font-semibold">Descrição (opcional)</div>
          <div className="mt-2">
            <Input
              placeholder="Ex: almoço, mercado..."
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

        {kind === "expense" ? (
          <>
            <Switch checked={isRecurring} onChange={setIsRecurring} label="Recorrente" />
            <Switch
              checked={useCard}
              onChange={(v) => {
                setUseCard(v);
                if (!v) setCardId(null);
              }}
              label="Cartão"
            />
          </>
        ) : null}

        {useCard ? (
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-sm font-semibold">Selecionar cartão</div>
            <div className="mt-2 space-y-2">
              {creditCards.length === 0 ? (
                <div className="text-sm text-[var(--muted)]">
                  Nenhum cartão cadastrado ainda. Vá em Config → Cartões.
                </div>
              ) : (
                creditCards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCardId(c.id)}
                    className={
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 " +
                      (cardId === c.id ? "bg-white/10" : "hover:bg-white/5")
                    }
                  >
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      fecha {c.statement_closing_day}
                      {c.statement_due_day ? ` / vence ${c.statement_due_day}` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

        <Button onClick={() => void onSave()}>Salvar</Button>
      </div>
    </BottomSheet>
  );
}
