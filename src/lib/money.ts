export type Cents = number;

/**
 * Formata centavos como BRL.
 * Ex: 1050 -> "R$ 10,50"
 */
export function formatBRLFromCents(valueCents: Cents): string {
  const value = valueCents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse simples de input BRL para centavos.
 * Aceita: "10", "10,5", "10,50", "R$ 10,50"
 */
export function parseBRLToCents(raw: string): Cents | null {
  const cleaned = raw
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=.*\.)/g, "") // remove pontos extras
    .trim();

  if (!cleaned) return null;

  // pt-BR: vírgula decimal
  const normalized = cleaned.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
