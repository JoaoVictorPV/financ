import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function todayYMD(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatYMDToBR(ymd: string): string {
  try {
    return format(parseISO(ymd), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return ymd;
  }
}

export function monthKey(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}
