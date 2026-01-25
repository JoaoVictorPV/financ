import type { InstallmentPlan, Tag, Transaction } from "@/lib/domain/types";
import { monthPrefixesForPreset, type RangePreset } from "@/features/insights/domain/range";

export function sumTransactionsByMonth(
  transactions: Transaction[],
  preset: RangePreset,
  kind: "expense" | "income",
): Array<{ month: string; total_cents: number }> {
  const months = monthPrefixesForPreset(preset);
  const map = new Map(months.map((m) => [m, 0]));
  for (const tx of transactions) {
    if (tx.kind !== kind) continue;
    const m = tx.date.slice(0, 7);
    if (!map.has(m)) continue;
    map.set(m, (map.get(m) ?? 0) + tx.amount_cents);
  }
  return months.map((m) => ({ month: m, total_cents: map.get(m) ?? 0 }));
}

export function sumExpensesBySelectedTags(
  transactions: Transaction[],
  tags: Tag[],
  preset: RangePreset,
  selectedTagIds: string[],
): { months: string[]; series: Array<{ tagId: string; name: string; data: number[]; color: string }> } {
  const months = monthPrefixesForPreset(preset);
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const series = selectedTagIds
    .map((id) => tagMap.get(id))
    .filter(Boolean)
    .map((t) => ({ tagId: t!.id, name: t!.name, color: t!.color, data: months.map(() => 0) }));

  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    const m = tx.date.slice(0, 7);
    const idx = months.indexOf(m);
    if (idx < 0) continue;
    for (const s of series) {
      if (tx.tags.includes(s.tagId)) {
        s.data[idx] += tx.amount_cents;
      }
    }
  }
  return { months, series };
}

export function sumCardInstallmentsByMonth(
  plans: InstallmentPlan[],
  preset: RangePreset,
): Array<{ month: string; total_cents: number }> {
  const months = monthPrefixesForPreset(preset);
  const map = new Map(months.map((m) => [m, 0]));
  for (const p of plans) {
    const start = p.start_date.slice(0, 7);
    const [y0, m0] = start.split("-").map(Number);
    for (let i = 0; i < p.total_installments; i++) {
      const d = new Date(y0, m0 - 1, 1);
      d.setMonth(d.getMonth() + i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(ym)) continue;
      map.set(ym, (map.get(ym) ?? 0) + p.installment_amount_cents);
    }
  }
  return months.map((m) => ({ month: m, total_cents: map.get(m) ?? 0 }));
}
