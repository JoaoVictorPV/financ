"use client";

import { useMemo } from "react";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/state/useAppStore";
import { formatBRLFromCents } from "@/lib/money";
import EChart from "@/features/insights/components/internal/EChart";

function pickTooltip(p: unknown): { name?: string; value?: unknown } {
  if (!p || typeof p !== "object") return {};
  const o = p as Record<string, unknown>;
  return {
    name: typeof o.name === "string" ? o.name : undefined,
    value: o.value,
  };
}

function currentMonthPrefix(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function MonthPieCharts() {
  const tags = useAppStore((s) => s.tags);
  const transactions = useAppStore((s) => s.transactions);

  const monthPrefix = useMemo(() => currentMonthPrefix(), []);

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const { expenseSeries, incomeSeries, expenseTotal, incomeTotal } = useMemo(() => {
    const expense = new Map<string, number>();
    const income = new Map<string, number>();

    for (const tx of transactions) {
      if (!tx.date.startsWith(monthPrefix)) continue;
      const bucket = tx.kind === "expense" ? expense : income;
      const useTags = tx.tags.length ? tx.tags : ["__sem_tag__"];
      for (const tid of useTags) {
        bucket.set(tid, (bucket.get(tid) ?? 0) + tx.amount_cents);
      }
    }

    const toSeries = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([tid, value]) => {
          const tag = tagMap.get(tid);
          return {
            name: tag ? tag.name : "Sem tag",
            value,
            itemStyle: { color: tag ? tag.color : "#64748b" },
          };
        })
        .sort((a, b) => b.value - a.value);

    const expenseSeries = toSeries(expense);
    const incomeSeries = toSeries(income);

    const expenseTotal = expenseSeries.reduce((acc, x) => acc + x.value, 0);
    const incomeTotal = incomeSeries.reduce((acc, x) => acc + x.value, 0);

    return { expenseSeries, incomeSeries, expenseTotal, incomeTotal };
  }, [transactions, monthPrefix, tagMap]);

  return (
    <div className="grid grid-cols-1 gap-3">
      <Card>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-base font-semibold">Gastos do mês</div>
            <div className="text-xs text-[var(--muted)]">{monthPrefix}</div>
          </div>
          <div className="text-sm font-bold">{formatBRLFromCents(expenseTotal)}</div>
        </div>
        <div className="mt-3 h-56">
          <EChart
            option={{
              tooltip: {
                trigger: "item",
                formatter: (p: unknown) => {
                  const x = pickTooltip(p);
                  return `${String(x.name ?? "")} : ${formatBRLFromCents(Number(x.value ?? 0))}`;
                },
              },
              series: [
                {
                  type: "pie",
                  radius: ["35%", "70%"],
                  avoidLabelOverlap: true,
                  label: { show: false },
                  data: expenseSeries,
                },
              ],
            }}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-base font-semibold">Entradas do mês</div>
            <div className="text-xs text-[var(--muted)]">{monthPrefix}</div>
          </div>
          <div className="text-sm font-bold">{formatBRLFromCents(incomeTotal)}</div>
        </div>
        <div className="mt-3 h-56">
          <EChart
            option={{
              tooltip: {
                trigger: "item",
                formatter: (p: unknown) => {
                  const x = pickTooltip(p);
                  return `${String(x.name ?? "")} : ${formatBRLFromCents(Number(x.value ?? 0))}`;
                },
              },
              series: [
                {
                  type: "pie",
                  radius: ["35%", "70%"],
                  avoidLabelOverlap: true,
                  label: { show: false },
                  data: incomeSeries,
                },
              ],
            }}
          />
        </div>
      </Card>
    </div>
  );
}
