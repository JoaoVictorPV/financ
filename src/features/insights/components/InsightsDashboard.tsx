"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { useAppStore } from "@/state/useAppStore";
import { formatBRLFromCents } from "@/lib/money";
import EChart from "@/features/insights/components/internal/EChart";
import type { RangePreset } from "@/features/insights/domain/range";
import type { EChartsOption, EChartsCallbackParams } from "@/features/insights/domain/echartsTypes";
import {
  sumCardInstallmentsByMonth,
  sumExpensesBySelectedTags,
  sumTransactionsByMonth,
} from "@/features/insights/domain/aggregations";

export default function InsightsDashboard() {
  const transactions = useAppStore((s) => s.transactions);
  const tags = useAppStore((s) => s.tags);
  const plans = useAppStore((s) => s.installmentPlans);
  const account = useAppStore((s) => s.account);

  const [preset, setPreset] = useState<RangePreset>("12m");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => tags.slice(0, 3).map((t) => t.id));

  const expenses = useMemo(() => sumTransactionsByMonth(transactions, preset, "expense"), [transactions, preset]);
  const income = useMemo(() => sumTransactionsByMonth(transactions, preset, "income"), [transactions, preset]);
  const card = useMemo(() => sumCardInstallmentsByMonth(plans, preset), [plans, preset]);
  const tagsSeries = useMemo(
    () => sumExpensesBySelectedTags(transactions, tags, preset, selectedTags),
    [transactions, tags, preset, selectedTags],
  );

  const totals = useMemo(() => {
    const e = expenses.reduce((acc, x) => acc + x.total_cents, 0);
    const i = income.reduce((acc, x) => acc + x.total_cents, 0);
    const c = card.reduce((acc, x) => acc + x.total_cents, 0);
    return { e, i, c, net: i - (e + c) };
  }, [expenses, income, card]);

  const optionExpenses: EChartsOption = useMemo(() => {
    return {
      grid: { left: 30, right: 10, top: 20, bottom: 30 },
      xAxis: { type: "category", data: expenses.map((x) => x.month), axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      tooltip: {
        trigger: "axis",
        formatter: (params: EChartsCallbackParams | EChartsCallbackParams[]) => {
          const arr = Array.isArray(params) ? params : [params];
          const p0 = arr[0];
          const raw = p0?.data;
          const val = typeof raw === "number" ? raw : 0;
          return `${p0?.axisValue ?? ""}: ${formatBRLFromCents(Math.round(val * 100))}`;
        },
      },
      series: [{ type: "line", smooth: true, showSymbol: false, data: expenses.map((x) => x.total_cents / 100), lineStyle: { width: 3, color: "#ef4444" }, areaStyle: { color: "rgba(239,68,68,0.12)" } }],
    };
  }, [expenses]);

  const optionIncome: EChartsOption = useMemo(() => {
    return {
      grid: { left: 30, right: 10, top: 20, bottom: 30 },
      xAxis: { type: "category", data: income.map((x) => x.month), axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      tooltip: {
        trigger: "axis",
        formatter: (params: EChartsCallbackParams | EChartsCallbackParams[]) => {
          const arr = Array.isArray(params) ? params : [params];
          const p0 = arr[0];
          const raw = p0?.data;
          const val = typeof raw === "number" ? raw : 0;
          return `${p0?.axisValue ?? ""}: ${formatBRLFromCents(Math.round(val * 100))}`;
        },
      },
      series: [{ type: "line", smooth: true, showSymbol: false, data: income.map((x) => x.total_cents / 100), lineStyle: { width: 3, color: "#22c55e" }, areaStyle: { color: "rgba(34,197,94,0.12)" } }],
    };
  }, [income]);

  const optionCard: EChartsOption = useMemo(() => {
    return {
      grid: { left: 30, right: 10, top: 20, bottom: 30 },
      xAxis: { type: "category", data: card.map((x) => x.month), axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      tooltip: {
        trigger: "axis",
        formatter: (params: EChartsCallbackParams | EChartsCallbackParams[]) => {
          const arr = Array.isArray(params) ? params : [params];
          const p0 = arr[0];
          const raw = p0?.data;
          const val = typeof raw === "number" ? raw : 0;
          return `${p0?.axisValue ?? ""}: ${formatBRLFromCents(Math.round(val * 100))}`;
        },
      },
      series: [{ type: "bar", data: card.map((x) => x.total_cents / 100), itemStyle: { color: "#38bdf8" } }],
    };
  }, [card]);

  const optionTags: EChartsOption = useMemo(() => {
    return {
      grid: { left: 30, right: 10, top: 20, bottom: 30 },
      legend: { textStyle: { color: "#94a3b8" } },
      xAxis: { type: "category", data: tagsSeries.months, axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      tooltip: { trigger: "axis" },
      series: tagsSeries.series.map((s) => ({
        name: s.name,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: s.data.map((v) => v / 100),
        lineStyle: { width: 3, color: s.color },
      })),
    };
  }, [tagsSeries]);

  const irTagId = useMemo(
    () => tags.find((t) => t.name.toLowerCase().includes("imposto"))?.id ?? null,
    [tags],
  );
  const irTotal = useMemo(() => {
    if (!irTagId) return 0;
    return transactions
      .filter((t) => t.kind === "expense")
      .filter((t) => t.tags.includes(irTagId))
      .reduce((acc, x) => acc + x.amount_cents, 0);
  }, [transactions, irTagId]);

  const saldo = account?.current_balance_cents ?? 0;

  function toggleTag(id: string) {
    if (selectedTags.includes(id)) setSelectedTags(selectedTags.filter((x) => x !== id));
    else setSelectedTags([...selectedTags, id].slice(0, 6));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Button size="md" variant={preset === "1m" ? "primary" : "secondary"} onClick={() => setPreset("1m")}>
          1 mês
        </Button>
        <Button size="md" variant={preset === "3m" ? "primary" : "secondary"} onClick={() => setPreset("3m")}>
          3 meses
        </Button>
        <Button size="md" variant={preset === "12m" ? "primary" : "secondary"} onClick={() => setPreset("12m")}>
          12 meses
        </Button>
      </div>

      <Card className="space-y-2">
        <div className="text-base font-semibold">Saúde financeira (período)</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Entradas</div>
            <div className="text-sm font-bold">{formatBRLFromCents(totals.i)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Gastos + Cartão</div>
            <div className="text-sm font-bold">{formatBRLFromCents(totals.e + totals.c)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Resultado</div>
            <div className="text-sm font-bold">{formatBRLFromCents(totals.net)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Impostos (tag)</div>
            <div className="text-sm font-bold">{formatBRLFromCents(irTotal)}</div>
          </div>
        </div>
        <div className="text-xs text-[var(--muted)]">Saldo atual (manual): {formatBRLFromCents(saldo)}</div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">(1) Gastos por tag — evolutivo</div>
          <div className="text-xs text-[var(--muted)]">Selecione até 6 tags</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.slice(0, 16).map((t) => (
            <Chip
              key={t.id}
              type="button"
              active={selectedTags.includes(t.id)}
              color={t.color}
              onClick={() => toggleTag(t.id)}
            >
              {t.name}
            </Chip>
          ))}
        </div>
        <div className="mt-3 h-64">
          <EChart option={optionTags} />
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">(2) Total de gastos</div>
          <div className="text-sm font-bold">{formatBRLFromCents(totals.e)}</div>
        </div>
        <div className="mt-3 h-56">
          <EChart option={optionExpenses} />
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">(3) Total de entradas</div>
          <div className="text-sm font-bold">{formatBRLFromCents(totals.i)}</div>
        </div>
        <div className="mt-3 h-56">
          <EChart option={optionIncome} />
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">(4) Cartão — parcelas por mês</div>
          <div className="text-sm font-bold">{formatBRLFromCents(totals.c)}</div>
        </div>
        <div className="mt-3 h-56">
          <EChart option={optionCard} />
        </div>
      </Card>
    </div>
  );
}
