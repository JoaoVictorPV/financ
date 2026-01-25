"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/state/useAppStore";
import { monthPrefix } from "@/lib/calendar";
import CalendarMonth from "@/features/calendar/components/CalendarMonth";
import {
  buildCalendarEventsBetween,
  buildDayMarks,
  monthProjection,
} from "@/features/calendar/domain/events";
import { formatBRLFromCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonthsSafe(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function monthRangeYmd(base: Date): { startYmd: string; endYmd: string } {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return {
    startYmd: start.toISOString().slice(0, 10),
    endYmd: end.toISOString().slice(0, 10),
  };
}

export default function CalendarPage() {
  const transactions = useAppStore((s) => s.transactions);
  const recurringTemplates = useAppStore((s) => s.recurringTemplates);
  const installmentPlans = useAppStore((s) => s.installmentPlans);
  const tags = useAppStore((s) => s.tags);

  const [selected, setSelected] = useState(todayYMD());

  // mês exibido (default: mês atual)
  const [base, setBase] = useState<Date>(() => monthStart(new Date()));
  const range = useMemo(() => monthRangeYmd(base), [base]);

  const events = useMemo(() => {
    return buildCalendarEventsBetween({
      startYmd: range.startYmd,
      endYmd: range.endYmd,
      transactions,
      recurringTemplates,
      installmentPlans,
    });
  }, [range, transactions, recurringTemplates, installmentPlans]);

  const marks = useMemo(() => buildDayMarks(events), [events]);

  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selected),
    [events, selected],
  );

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t.name])), [tags]);

  const selectedDate = useMemo(() => new Date(selected + "T00:00:00"), [selected]);
  const ym = useMemo(
    () => ({ year: base.getFullYear(), month: base.getMonth() + 1 }),
    [base],
  );
  const proj = useMemo(() => monthProjection({ year: ym.year, month: ym.month, events }), [ym, events]);

  // Se o usuário selecionar uma data fora do mês visível (ex: via estado), sincroniza
  useEffect(() => {
    const mStart = monthStart(selectedDate);
    if (mStart.getFullYear() !== base.getFullYear() || mStart.getMonth() !== base.getMonth()) {
      setBase(mStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Navegação por swipe/arrastar
  const touch = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touch.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // só considera swipe horizontal
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) setBase((b) => addMonthsSafe(b, 1));
    else setBase((b) => addMonthsSafe(b, -1));
  }

  function monthInputValue(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
          onClick={() => setBase((b) => addMonthsSafe(b, -1))}
        >
          ←
        </button>

        <div className="flex-1">
          <input
            type="month"
            value={monthInputValue(base)}
            className="w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
            onChange={(e) => {
              const v = e.target.value; // YYYY-MM
              if (!v) return;
              const [y, m] = v.split("-").map(Number);
              if (!y || !m) return;
              setBase(new Date(y, m - 1, 1));
              // move a seleção para o 1º dia do mês se estiver fora
              const firstYmd = `${y}-${String(m).padStart(2, "0")}-01`;
              if (!selected.startsWith(`${y}-${String(m).padStart(2, "0")}`)) {
                setSelected(firstYmd);
              }
            }}
          />
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
          onClick={() => setBase((b) => addMonthsSafe(b, 1))}
        >
          →
        </button>
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="rounded-2xl">
        <CalendarMonth base={base} marks={marks} selectedYmd={selected} onSelect={setSelected} />
      </div>

      <Card className="space-y-2">
        <div className="text-base font-semibold">Dia selecionado</div>
        <div className="text-sm text-[var(--muted)]">{selected}</div>
        <div className="mt-2 space-y-2">
          {dayEvents.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">Sem eventos neste dia.</div>
          ) : (
            dayEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{e.title}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {e.type}
                      {e.tags.length
                        ? ` • ${e.tags.map((t) => tagMap.get(t)).filter(Boolean).join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <div className="text-sm font-bold">{formatBRLFromCents(e.amount_cents)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-base font-semibold">Projeção do mês</div>
            <div className="text-xs text-[var(--muted)]">{monthPrefix(ym.year, ym.month)}</div>
          </div>
          <div className="text-sm font-bold">{formatBRLFromCents(proj.net)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Entradas</div>
            <div className="text-sm font-bold">{formatBRLFromCents(proj.income)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Despesas</div>
            <div className="text-sm font-bold">{formatBRLFromCents(proj.expense)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Recorrências</div>
            <div className="text-sm font-bold">{formatBRLFromCents(proj.recurring)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-xs text-[var(--muted)]">Cartão (parcelas)</div>
            <div className="text-sm font-bold">{formatBRLFromCents(proj.card)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
