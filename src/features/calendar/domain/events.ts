import type {
  InstallmentPlan,
  RecurringTemplate,
  Transaction,
} from "@/lib/domain/types";
import { monthPrefix } from "@/lib/calendar";
import { projectRecurringBetween } from "@/features/recurring/domain/projection";
import { addMonths, parseISO } from "date-fns";

export type CalendarEventType = "expense" | "income" | "installment" | "recurring";

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD
  title: string;
  amount_cents: number;
  tags: string[];
  meta?: Record<string, unknown>;
};

export type DayMark = {
  hasExpense: boolean;
  hasIncome: boolean;
  hasCard: boolean;
  hasRecurring: boolean;
};

export function buildCalendarEventsBetween(input: {
  startYmd: string;
  endYmd: string;
  transactions: Transaction[];
  recurringTemplates: RecurringTemplate[];
  installmentPlans: InstallmentPlan[];
}): CalendarEvent[] {
  const { startYmd, endYmd, transactions, recurringTemplates, installmentPlans } = input;

  const events: CalendarEvent[] = [];

  // transações reais
  for (const tx of transactions) {
    if (tx.date < startYmd || tx.date > endYmd) continue;
    events.push({
      id: tx.id,
      type: tx.kind,
      date: tx.date,
      title: tx.description || "(sem descrição)",
      amount_cents: tx.amount_cents,
      tags: tx.tags,
      meta: {
        credit_card_id: tx.credit_card_id,
      },
    });
  }

  // recorrências projetadas
  const projected = projectRecurringBetween(recurringTemplates, startYmd, endYmd);
  for (const pr of projected) {
    events.push({
      id: pr.id,
      type: "recurring",
      date: pr.date,
      title: pr.description,
      amount_cents: pr.amount_cents,
      tags: pr.tags,
      meta: { template_id: pr.template_id, kind: pr.kind },
    });
  }

  // parcelas projetadas
  for (const p of installmentPlans) {
    const pStart = parseISO(p.start_date);
    const startDay = pStart.getDate();
    for (let i = 0; i < p.total_installments; i++) {
      const instMonth = addMonths(new Date(pStart.getFullYear(), pStart.getMonth(), 1), i);
      const y = instMonth.getFullYear();
      const m = instMonth.getMonth() + 1;
      const d = Math.min(28, Math.max(1, startDay));
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (date < startYmd || date > endYmd) continue;
      events.push({
        id: `${p.id}#${i + 1}`,
        type: "installment",
        date,
        title: `${p.description || "(parcelado)"} — ${i + 1}/${p.total_installments}`,
        amount_cents: p.installment_amount_cents,
        tags: p.tags,
        meta: { plan_id: p.id, credit_card_id: p.credit_card_id },
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function buildDayMarks(events: CalendarEvent[]): Map<string, DayMark> {
  const map = new Map<string, DayMark>();
  for (const e of events) {
    const prev = map.get(e.date) ?? {
      hasExpense: false,
      hasIncome: false,
      hasCard: false,
      hasRecurring: false,
    };
    const next = { ...prev };
    if (e.type === "expense") next.hasExpense = true;
    if (e.type === "income") next.hasIncome = true;
    if (e.type === "installment") next.hasCard = true;
    if (e.type === "recurring") next.hasRecurring = true;
    map.set(e.date, next);
  }
  return map;
}

export function monthProjection(input: {
  year: number;
  month: number;
  events: CalendarEvent[];
}) {
  const prefix = monthPrefix(input.year, input.month);
  let income = 0;
  let expense = 0;
  let recurring = 0;
  let card = 0;
  for (const e of input.events) {
    if (!e.date.startsWith(prefix)) continue;
    if (e.type === "income") income += e.amount_cents;
    if (e.type === "expense") expense += e.amount_cents;
    if (e.type === "recurring") recurring += e.amount_cents;
    if (e.type === "installment") card += e.amount_cents;
  }
  return {
    income,
    expense,
    recurring,
    card,
    net: income - (expense + recurring + card),
  };
}
