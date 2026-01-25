"use client";

import { useMemo } from "react";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DayMark } from "@/features/calendar/domain/events";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CalendarMonth({
  base,
  marks,
  selectedYmd,
  onSelect,
}: {
  base: Date; // primeiro dia do mês
  marks: Map<string, DayMark>;
  selectedYmd: string;
  onSelect: (ymd: string) => void;
}) {
  const grid = useMemo(() => {
    const first = startOfMonth(base);
    const last = endOfMonth(base);
    const start = new Date(first);
    // começa no domingo
    start.setDate(first.getDate() - first.getDay());

    const days: Date[] = [];
    let cursor = start;
    while (cursor <= last || cursor.getDay() !== 0) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
      if (days.length > 42) break;
    }
    return { first, last, days };
  }, [base]);

  const title = useMemo(() => format(base, "MMMM yyyy", { locale: ptBR }), [base]);

  const week = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-3">
      <div className="px-1 pb-2 text-sm font-semibold capitalize">{title}</div>
      <div className="grid grid-cols-7 gap-1 px-1 text-[10px] text-[var(--muted)]">
        {week.map((w, idx) => (
          <div key={`${idx}-${w}`} className="text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {grid.days.map((d) => {
          const inMonth = d.getMonth() === base.getMonth();
          const key = ymd(d);
          const mark = marks.get(key);
          const selected = key === selectedYmd;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={
                "relative flex h-11 flex-col items-center justify-center rounded-xl border border-transparent text-sm font-semibold " +
                (selected
                  ? "bg-[var(--primary)] text-black"
                  : inMonth
                    ? "bg-black/10 text-[var(--text)] hover:bg-white/5"
                    : "bg-transparent text-white/25")
              }
            >
              <div className="leading-none">{d.getDate()}</div>
              {mark && !selected ? (
                <div className="absolute bottom-1 flex gap-1">
                  {mark.hasExpense ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                  ) : null}
                  {mark.hasIncome ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  ) : null}
                  {mark.hasCard ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  ) : null}
                  {mark.hasRecurring ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
