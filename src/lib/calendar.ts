import { addMonths, endOfMonth, format, getDay, startOfMonth, subMonths } from "date-fns";

export function ymdFromDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function ymFromDate(d: Date): { year: number; month: number } {
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function buildTriMonthBase(center: Date): Date[] {
  // mês atual + 2 anteriores
  return [subMonths(center, 2), subMonths(center, 1), center].map((d) => startOfMonth(d));
}

export function lastBusinessDayOfMonth(year: number, month: number): string {
  const d = endOfMonth(new Date(year, month - 1, 1));
  const dow = getDay(d); // 0=dom
  if (dow === 0) d.setDate(d.getDate() - 2);
  if (dow === 6) d.setDate(d.getDate() - 1);
  return ymdFromDate(d);
}

export function closingPeriodForCard(
  dateYmd: string,
  closingDay: number,
): { year: number; month: number } {
  // regra do plano: até o dia do fechamento → fatura do mês; depois → próximo mês
  const [y, m, d] = dateYmd.split("-").map(Number);
  const base = new Date(y, m - 1, 1);
  if (d <= closingDay) {
    return { year: y, month: m };
  }
  const next = addMonths(base, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}
