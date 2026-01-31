import type { MarketValues } from "./types";

export function formatNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatMoneyBRL(n: number, digits = 2) {
  return `R$ ${formatNumber(n, digits)}`;
}

export function formatMoneyUSD(n: number, digits = 2) {
  return `US$ ${formatNumber(n, digits)}`;
}

export function formatPercentFromDecimal(n: number, digits = 2) {
  return `${formatNumber(n * 100, digits)}%`;
}

export function formatValue(
  id: keyof MarketValues,
  values: MarketValues,
  opts?: { precision?: number; unit?: string },
): string {
  const v = values[id];
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";

  const precision = opts?.precision;
  const unit = opts?.unit;

  // heurísticas por tipo
  if (id.includes("_brl")) {
    return formatMoneyBRL(v, precision ?? 3);
  }
  if (id.includes("_usd")) {
    return formatMoneyUSD(v, precision ?? 2) + (unit ? ` ${unit}` : "");
  }
  if (id.includes("_aa") || id.includes("_mom") || id.includes("_12m") || id.includes("_real_")) {
    // no backend: alguns já estão em decimal (Selic/IPCA), outros são % (FRED yields)
    // regra: se for muito pequeno, tratar como decimal
    if (Math.abs(v) <= 1) return formatPercentFromDecimal(v, precision ?? 2);
    return `${formatNumber(v, precision ?? 2)}%`;
  }
  if (unit === "bps") return `${formatNumber(v, 0)} bps`;
  if (unit) return `${formatNumber(v, precision ?? 2)} ${unit}`;
  return formatNumber(v, precision ?? 2);
}
