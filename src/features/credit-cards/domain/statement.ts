import type { CardPurchase, CreditCard, InstallmentPlan } from "@/lib/domain/types";
import { closingPeriodForCard, monthPrefix } from "@/lib/calendar";

export type CardStatementSummary = {
  creditCardId: string;
  year: number;
  month: number;
  totalCents: number;
};

export type StatementLineItem = {
  source: "transaction" | "installment";
  id: string;
  date: string;
  description: string;
  amount_cents: number;
  tags: string[];
};

export function buildStatementsForRange(
  cards: CreditCard[],
  purchases: CardPurchase[],
  plans: InstallmentPlan[],
  months: Array<{ year: number; month: number }>,
): CardStatementSummary[] {
  const results: CardStatementSummary[] = [];
  for (const card of cards) {
    for (const { year, month } of months) {
      const totalCents = calcStatementTotalForMonth(card, year, month, purchases, plans);
      results.push({ creditCardId: card.id, year, month, totalCents });
    }
  }
  return results;
}

export function calcStatementTotalForMonth(
  card: CreditCard,
  year: number,
  month: number,
  purchases: CardPurchase[],
  plans: InstallmentPlan[],
): number {
  const target = monthPrefix(year, month);
  let total = 0;

  // compras internas do cartão
  for (const p of purchases) {
    if (p.credit_card_id !== card.id) continue;
    const period = closingPeriodForCard(p.date, card.statement_closing_day);
    if (period.year === year && period.month === month) total += p.amount_cents;
  }

  // parcelas derivadas
  for (const p of plans) {
    if (p.credit_card_id !== card.id) continue;

    // parcela 1 cai no mês da compra (start_date)
    const startPrefix = p.start_date.slice(0, 7);
    for (let i = 0; i < p.total_installments; i++) {
      const ym = addMonthsToPrefix(startPrefix, i);
      if (ym === target) {
        const period = closingPeriodForCard(`${ym}-01`, card.statement_closing_day);
        if (period.year === year && period.month === month) {
          // ajuste: parcela pertence ao período da fatura calculado sobre o mês
          total += p.installment_amount_cents;
        }
      }
    }
  }

  return total;
}

export function buildStatementItems(
  card: CreditCard,
  year: number,
  month: number,
  purchases: CardPurchase[],
  plans: InstallmentPlan[],
): StatementLineItem[] {
  const items: StatementLineItem[] = [];
  const target = { year, month };

  for (const p of purchases) {
    if (p.credit_card_id !== card.id) continue;
    const period = closingPeriodForCard(p.date, card.statement_closing_day);
    if (period.year === target.year && period.month === target.month) {
      items.push({
        source: "transaction",
        id: p.id,
        date: p.date,
        description: p.description || "(sem descrição)",
        amount_cents: p.amount_cents,
        tags: p.card_tag_ids,
      });
    }
  }

  for (const p of plans) {
    if (p.credit_card_id !== card.id) continue;

    const startPrefix = p.start_date.slice(0, 7);
    for (let i = 0; i < p.total_installments; i++) {
      const ym = addMonthsToPrefix(startPrefix, i);
      const period = closingPeriodForCard(`${ym}-01`, card.statement_closing_day);
      if (period.year === target.year && period.month === target.month) {
        items.push({
          source: "installment",
          id: `${p.id}#${i + 1}`,
          date: `${ym}-01`,
          description: `${p.description || "(parcelado)"} — ${i + 1}/${p.total_installments}`,
          amount_cents: p.installment_amount_cents,
          tags: p.tags,
        });
      }
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

function addMonthsToPrefix(ym: string, add: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + add);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
