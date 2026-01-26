"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAppStore } from "@/state/useAppStore";
import { centsToSimpleInput, formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import TransactionFormSheet from "@/features/transactions/components/TransactionFormSheet";
import RecurringFormSheet from "@/features/recurring/components/RecurringFormSheet";
import CardPurchaseFormSheet from "@/features/credit-cards/components/CardPurchaseFormSheet";
import TransactionsWeekTable from "@/features/transactions/components/TransactionsWeekTable";
import MonthPieCharts from "@/features/insights/components/MonthPieCharts";

export default function HomePage() {
  const account = useAppStore((s) => s.account);
  const setAccountBalanceCents = useAppStore((s) => s.setAccountBalanceCents);

  const [openExpense, setOpenExpense] = useState(false);
  const [openRecurring, setOpenRecurring] = useState(false);
  const [openCardExpense, setOpenCardExpense] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);

  const [balanceInput, setBalanceInput] = useState(() =>
    // Mantém um formato simples para digitação (usuário costuma digitar "5000")
    account ? centsToSimpleInput(account.current_balance_cents) : "0",
  );

  // garante que o input acompanhe o último valor salvo (persistência visual)
  // ex: após recarregar a página ou após sync/migração.
  useEffect(() => {
    if (!account) return;
    setBalanceInput(centsToSimpleInput(account.current_balance_cents));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.current_balance_cents]);

  const balanceHint = useMemo(() => {
    const cents = parseBRLToCents(balanceInput);
    if (cents === null) return null;
    return formatBRLFromCents(cents);
  }, [balanceInput]);

  async function onSaveBalance() {
    const cents = parseBRLToCents(balanceInput);
    if (cents === null) return;
    await setAccountBalanceCents(cents);
    // após salvar, volta para um formato simples para próxima edição
    setBalanceInput(centsToSimpleInput(cents));
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-[var(--muted)]">Saldo atual</div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              inputMode="decimal"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              // não salvar no blur (usuário pediu);
              // salva somente no botão.
              placeholder="R$ 0,00"
            />
            <button
              onClick={() => void onSaveBalance()}
              className="whitespace-nowrap rounded-xl bg-[var(--primary)] px-4 py-3 text-base font-semibold text-black"
            >
              Salvar
            </button>
          </div>
          {balanceHint ? (
            <div className="mt-2 text-xs text-[var(--muted)]">{balanceHint}</div>
          ) : (
            <div className="mt-2 text-xs text-[var(--danger)]">
              Valor inválido
            </div>
          )}
        </div>
      </Card>

      <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-3">
        <div className="text-sm font-semibold text-[var(--muted)]">Lançamentos rápidos</div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <Button onClick={() => setOpenExpense(true)}>Nova despesa</Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" onClick={() => setOpenRecurring(true)}>
              Despesa recorrente
            </Button>
            <Button variant="secondary" size="md" onClick={() => setOpenCardExpense(true)}>
              Despesa no cartão
            </Button>
          </div>

          <Button variant="ghost" onClick={() => setOpenIncome(true)}>
            Nova entrada
          </Button>
        </div>
      </div>

      <MonthPieCharts />

      <TransactionsWeekTable />

      <TransactionFormSheet
        open={openExpense}
        onClose={() => setOpenExpense(false)}
        kind="expense"
      />

      <RecurringFormSheet
        open={openRecurring}
        onClose={() => setOpenRecurring(false)}
      />

      <CardPurchaseFormSheet
        open={openCardExpense}
        onClose={() => setOpenCardExpense(false)}
      />

      <TransactionFormSheet
        open={openIncome}
        onClose={() => setOpenIncome(false)}
        kind="income"
      />
    </div>
  );
}
