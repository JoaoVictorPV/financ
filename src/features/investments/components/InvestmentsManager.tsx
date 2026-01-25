"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import { useAppStore } from "@/state/useAppStore";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";
import type { Investment, InvestmentType } from "@/lib/domain/types";
import {
  annualToMonthlyRate,
  applyIROnGain,
  futureValueNoContrib,
  futureValueWithContrib,
} from "@/features/investments/domain/projection";
import EChart from "@/features/insights/components/internal/EChart";
import type { EChartsOption } from "@/features/insights/domain/echartsTypes";

const TYPES: Array<{ id: InvestmentType; label: string }> = [
  { id: "tesouro", label: "Tesouro" },
  { id: "cdb", label: "CDB" },
  { id: "bolsa", label: "Bolsa" },
  { id: "poupanca", label: "Poupança" },
  { id: "consorcio", label: "Consórcio" },
  { id: "bonus", label: "Bônus" },
  { id: "misc", label: "Misc" },
];

export default function InvestmentsManager() {
  const investments = useAppStore((s) => s.investments);
  const snaps = useAppStore((s) => s.investmentSnapshots);
  const addInvestment = useAppStore((s) => s.addInvestment);
  const updateInvestment = useAppStore((s) => s.updateInvestment);
  const deleteInvestment = useAppStore((s) => s.deleteInvestment);
  const addInvestmentSnapshot = useAppStore((s) => s.addInvestmentSnapshot);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const [type, setType] = useState<InvestmentType>("tesouro");
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [monthlyRate, setMonthlyRate] = useState(""); // 0.01
  const [annualRate, setAnnualRate] = useState(""); // 0.12
  const [irRate, setIrRate] = useState(""); // 0.15
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contrib, setContrib] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setEditing(null);
    setType("tesouro");
    setName("");
    setCurrent("");
    setMonthlyRate("");
    setAnnualRate("");
    setIrRate("");
    setStartDate("");
    setEndDate("");
    setContrib("");
    setNotes("");
  }

  function openNew() {
    reset();
    setOpen(true);
  }

  function openEdit(inv: Investment) {
    setEditing(inv);
    setType(inv.type);
    setName(inv.name);
    setCurrent(formatBRLFromCents(inv.current_value_cents));
    setMonthlyRate(inv.expected_monthly_rate?.toString() ?? "");
    setAnnualRate(inv.expected_annual_rate?.toString() ?? "");
    setIrRate(inv.expected_ir_rate?.toString() ?? "");
    setStartDate(inv.start_date ?? "");
    setEndDate(inv.end_date ?? "");
    setContrib(inv.monthly_contribution ? formatBRLFromCents(inv.monthly_contribution) : "");
    setNotes(inv.notes ?? "");
    setOpen(true);
  }

  async function onSave() {
    const currentC = parseBRLToCents(current);
    if (!name.trim() || !currentC || currentC <= 0) return;
    const m = monthlyRate.trim() ? Number(monthlyRate) : null;
    const a = annualRate.trim() ? Number(annualRate) : null;
    const ir = irRate.trim() ? Number(irRate) : null;
    const c = contrib.trim() ? parseBRLToCents(contrib) : null;

    if (!editing) {
      const inv = await addInvestment({
        type,
        name,
        current_value_cents: currentC,
        currency: "BRL",
        expected_monthly_rate: m,
        expected_annual_rate: a,
        expected_ir_rate: ir,
        start_date: startDate || null,
        end_date: endDate || null,
        monthly_contribution: c,
        notes: notes || null,
      });
      // snapshot inicial
      await addInvestmentSnapshot({
        investment_id: inv.id,
        date: todayYMD(),
        value_cents: currentC,
        notes: "snapshot inicial",
      });
    } else {
      await updateInvestment(editing.id, {
        type,
        name,
        current_value_cents: currentC,
        expected_monthly_rate: m,
        expected_annual_rate: a,
        expected_ir_rate: ir,
        start_date: startDate || null,
        end_date: endDate || null,
        monthly_contribution: c,
        notes: notes || null,
      });
      // snapshot automático ao atualizar valor
      await addInvestmentSnapshot({
        investment_id: editing.id,
        date: todayYMD(),
        value_cents: currentC,
        notes: "atualização",
      });
    }

    setOpen(false);
    reset();
  }

  async function onDelete() {
    if (!editing) return;
    await deleteInvestment(editing.id);
    setOpen(false);
    reset();
  }

  const totalInvested = useMemo(
    () => investments.reduce((acc, i) => acc + i.current_value_cents, 0),
    [investments],
  );

  const projection12m = useMemo(() => {
    // soma projeção 12m de todos investimentos com taxa
    let total = 0;
    let tax = 0;
    for (const inv of investments) {
      const pv = inv.current_value_cents;
      const mRate =
        inv.expected_monthly_rate ??
        (inv.expected_annual_rate != null ? annualToMonthlyRate(inv.expected_annual_rate) : 0);
      const contribC = inv.monthly_contribution ?? 0;
      const fv =
        contribC > 0
          ? futureValueWithContrib(pv, mRate, 12, contribC)
          : futureValueNoContrib(pv, mRate, 12);
      const { fvAfterTaxCents, taxCents } = applyIROnGain(fv, pv, inv.expected_ir_rate);
      total += fvAfterTaxCents;
      tax += taxCents;
    }
    return { total, tax };
  }, [investments]);

  const selectedSnaps = useMemo(() => {
    if (!editing) return [];
    return snaps
      .filter((s) => s.investment_id === editing.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [snaps, editing]);

  const chartOption: EChartsOption | null = useMemo(() => {
    if (!editing) return null;
    const x = selectedSnaps.map((s) => s.date);
    const y = selectedSnaps.map((s) => (s.value_cents / 100).toFixed(2));
    return {
      grid: { left: 30, right: 10, top: 20, bottom: 30 },
      xAxis: { type: "category", data: x, axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      tooltip: { trigger: "axis" },
      series: [
        {
          type: "line",
          data: y,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: "#22c55e" },
          areaStyle: { color: "rgba(34,197,94,0.15)" },
        },
      ],
    };
  }, [editing, selectedSnaps]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={openNew}>Novo investimento</Button>
        <Button variant="secondary" onClick={() => setOpen(true)} disabled={investments.length === 0}>
          Editar
        </Button>
      </div>

      <Card className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">Total investido (atual)</div>
          <div className="text-sm font-bold">{formatBRLFromCents(totalInvested)}</div>
        </div>
        <div className="text-xs text-[var(--muted)]">Somatório dos valores atuais informados.</div>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold">Projeção 12 meses (estimativa)</div>
          <div className="text-sm font-bold">{formatBRLFromCents(projection12m.total)}</div>
        </div>
        <div className="text-xs text-[var(--muted)]">IR estimado: {formatBRLFromCents(projection12m.tax)}</div>
      </Card>

      <Card className="space-y-3">
        <div className="text-base font-semibold">Investimentos</div>
        {investments.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">Nenhum investimento ainda.</div>
        ) : (
          <div className="space-y-2">
            {investments.map((inv) => (
              <button
                key={inv.id}
                onClick={() => openEdit(inv)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-left"
              >
                <div>
                  <div className="text-sm font-semibold">{inv.name}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {TYPES.find((t) => t.id === inv.type)?.label ?? inv.type}
                    {inv.expected_monthly_rate != null ? ` • ${inv.expected_monthly_rate * 100}% a.m.` : ""}
                    {inv.expected_annual_rate != null ? ` • ${inv.expected_annual_rate * 100}% a.a.` : ""}
                  </div>
                </div>
                <div className="text-sm font-bold">{formatBRLFromCents(inv.current_value_cents)}</div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {editing && chartOption ? (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Histórico (snapshots)</div>
              <div className="text-xs text-[var(--muted)]">{editing.name}</div>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
              onClick={() => setEditing(null)}
            >
              Fechar
            </button>
          </div>
          <div className="mt-3 h-56">
            <EChart option={chartOption} />
          </div>
        </Card>
      ) : null}

      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={editing ? "Editar investimento" : "Novo investimento"}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-sm font-semibold">Tipo</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={
                    "rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold " +
                    (type === t.id ? "bg-[var(--primary)] text-black" : "bg-black/10")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Nome</div>
            <div className="mt-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Tesouro Selic" />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Valor atual</div>
            <div className="mt-2">
              <Input inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="R$ 0,00" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-sm font-semibold">Taxa a.m.</div>
              <div className="mt-2">
                <Input value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} placeholder="0.01" />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">Taxa a.a.</div>
              <div className="mt-2">
                <Input value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="0.12" />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">IR</div>
              <div className="mt-2">
                <Input value={irRate} onChange={(e) => setIrRate(e.target.value)} placeholder="0.15" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold">Início (opcional)</div>
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

          <div>
            <div className="text-sm font-semibold">Aporte mensal (opcional)</div>
            <div className="mt-2">
              <Input inputMode="decimal" value={contrib} onChange={(e) => setContrib(e.target.value)} placeholder="R$ 0,00" />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Notas (opcional)</div>
            <div className="mt-2">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="" />
            </div>
          </div>

          <div className={editing ? "grid grid-cols-2 gap-3" : ""}>
            <Button onClick={() => void onSave()}>{editing ? "Salvar + snapshot" : "Criar + snapshot"}</Button>
            {editing ? (
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
