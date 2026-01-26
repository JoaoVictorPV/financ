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
  // Regras desejadas:
  // - aceitar "5000" como R$ 5.000,00 (inteiro vira reais)
  // - aceitar "5000,50" / "5000.50" como R$ 5.000,50
  // - aceitar "R$ 5.000,50" / "5.000,50" etc
  // - ser tolerante, mas determinístico.
  const cleaned = raw.replace(/[^0-9,.-]/g, "").trim();

  if (!cleaned) return null;

  // Se contém vírgula, assumimos que é decimal pt-BR.
  // Se contém ponto e também vírgula, remove separadores de milhar e usa vírgula como decimal.
  // Se contém apenas ponto, e tiver exatamente 2 dígitos após o ponto, assumimos decimal.
  // Caso contrário, tratamos ponto como separador de milhar.
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;

  if (hasComma) {
    // remove pontos (milhar)
    normalized = normalized.replace(/\./g, "");
    // vírgula vira decimal
    normalized = normalized.replace(",", ".");
  } else if (hasDot) {
    const parts = normalized.split(".");
    if (parts.length === 2 && parts[1].length === 2) {
      // decimal padrão
      // mantém como está
    } else {
      // provavelmente separador de milhar
      normalized = normalized.replace(/\./g, "");
    }
  } else {
    // só dígitos (ou sinal): aqui o usuário digitou "5000" => reais
    // Para evitar que vire R$ 50,00 por engano, interpretamos como reais.
  }

  // Caso não tenha separador decimal, interpretamos como reais inteiros.
  const hasDecimal = normalized.includes(".");

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return hasDecimal ? Math.round(n * 100) : Math.round(n * 100);
}
