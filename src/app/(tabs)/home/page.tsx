"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAppStore } from "@/state/useAppStore";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import TransactionFormSheet from "@/features/transactions/components/TransactionFormSheet";
import TransactionsWeekTable from "@/features/transactions/components/TransactionsWeekTable";
import MonthPieCharts from "@/features/insights/components/MonthPieCharts";

export default function HomePage() {
  const account = useAppStore((s) => s.account);
  const setAccountBalanceCents = useAppStore((s) => s.setAccountBalanceCents);

  const [openExpense, setOpenExpense] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);

  const [balanceInput, setBalanceInput] = useState(() =>
    account ? formatBRLFromCents(account.current_balance_cents) : "R$ 0,00",
  );

  const balanceHint = useMemo(() => {
    const cents = parseBRLToCents(balanceInput);
    if (cents === null) return null;
    return formatBRLFromCents(cents);
  }, [balanceInput]);

  async function onSaveBalance() {
    const cents = parseBRLToCents(balanceInput);
    if (cents === null) return;
    await setAccountBalanceCents(cents);
    setBalanceInput(formatBRLFromCents(cents));
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
              onBlur={() => void onSaveBalance()}
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

      <div className="grid grid-cols-1 gap-3">
        <Button onClick={() => setOpenExpense(true)}>Nova despesa</Button>
        <Button variant="secondary" onClick={() => setOpenIncome(true)}>
          Nova entrada
        </Button>
      </div>

      <MonthPieCharts />

      <TransactionsWeekTable />

      <TransactionFormSheet
        open={openExpense}
        onClose={() => setOpenExpense(false)}
        kind="expense"
      />
      <TransactionFormSheet
        open={openIncome}
        onClose={() => setOpenIncome(false)}
        kind="income"
      />
    </div>
  );
}
