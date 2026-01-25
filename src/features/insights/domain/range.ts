export type RangePreset = "1m" | "3m" | "12m";

export function monthPrefixFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthPrefixesForPreset(preset: RangePreset): string[] {
  const count = preset === "1m" ? 1 : preset === "3m" ? 3 : 12;
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    const x = new Date(d);
    x.setMonth(d.getMonth() - i);
    out.push(monthPrefixFromDate(x));
  }
  return out.reverse();
}
