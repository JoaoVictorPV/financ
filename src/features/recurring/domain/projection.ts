import type { RecurringTemplate } from "@/lib/domain/types";
import { lastBusinessDayOfMonth } from "@/lib/calendar";
import { addDays, addMonths, addWeeks, parseISO } from "date-fns";

export type ProjectedRecurringEvent = {
  id: string; // virtual id
  template_id: string;
  kind: "expense" | "income";
  date: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD (quando vencimento difere da data do mês)
  description: string;
  amount_cents: number;
  tags: string[];
  recurring_tag_id?: string | null;
};

export function projectRecurringBetween(
  templates: RecurringTemplate[],
  startYmd: string,
  endYmd: string,
): ProjectedRecurringEvent[] {
  const start = parseISO(startYmd);
  const end = parseISO(endYmd);
  const out: ProjectedRecurringEvent[] = [];

  for (const t of templates) {
    const tStart = parseISO(t.start_date);
    const tEnd = t.end_date ? parseISO(t.end_date) : null;

    // intervalo efetivo
    const from = start > tStart ? start : tStart;
    const to = tEnd && tEnd < end ? tEnd : end;
    if (from > to) continue;

    if (t.frequency === "monthly") {
      // itera meses
      let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
      const endMonth = new Date(to.getFullYear(), to.getMonth(), 1);
      while (cursor <= endMonth) {
        const y = cursor.getFullYear();
        const m = cursor.getMonth() + 1;
        let dateYmd: string;
        if (t.monthly_rule === "lastBusinessDay") {
          dateYmd = lastBusinessDayOfMonth(y, m);
        } else {
          const day = Math.min(28, Math.max(1, t.day_of_month ?? 1));
          dateYmd = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }

        // vencimento opcional
        const dueDay = t.due_day_of_month ?? null;
        const dueYmd = dueDay
          ? `${y}-${String(m).padStart(2, "0")}-${String(Math.min(28, Math.max(1, dueDay))).padStart(2, "0")}`
          : null;

        const d = parseISO(dueYmd ?? dateYmd);
        if (d >= from && d <= to) {
          out.push({
            id: `${t.id}:${dueYmd ?? dateYmd}`,
            template_id: t.id,
            kind: t.kind,
            date: dueYmd ?? dateYmd,
            due_date: dueYmd ?? undefined,
            description: t.description,
            amount_cents: t.amount_cents,
            tags: t.tags,
            recurring_tag_id: t.recurring_tag_id ?? null,
          });
        }

        cursor = addMonths(cursor, 1);
      }
    } else if (t.frequency === "weekly") {
      const dow = t.day_of_week ?? 0;
      // encontra o próximo dia da semana
      let cursor = new Date(from);
      while (cursor.getDay() !== dow) cursor = addDays(cursor, 1);
      while (cursor <= to) {
        const dateYmd = cursor.toISOString().slice(0, 10);
        out.push({
          id: `${t.id}:${dateYmd}`,
          template_id: t.id,
          kind: t.kind,
          date: dateYmd,
          description: t.description,
          amount_cents: t.amount_cents,
          tags: t.tags,
        });
        cursor = addWeeks(cursor, 1);
      }
    } else if (t.frequency === "yearly") {
      const [, startMonth, startDay] = t.start_date.split("-").map(Number);
      let y = from.getFullYear();
      const endYear = to.getFullYear();
      while (y <= endYear) {
        const dateYmd = `${y}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
        const d = parseISO(dateYmd);
        if (d >= from && d <= to) {
          out.push({
            id: `${t.id}:${dateYmd}`,
            template_id: t.id,
            kind: t.kind,
            date: dateYmd,
            description: t.description,
            amount_cents: t.amount_cents,
            tags: t.tags,
          });
        }
        y++;
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
