import type { LocalSnapshot } from "@/state/utils/localPersistence";
import type { CardPurchase, CreditCard, Transaction } from "@/lib/domain/types";

/**
 * Migra dados antigos sem perder nada.
 *
 * v3 (Cartões):
 * - Antigo: compras no cartão eram Transaction com credit_card_id.
 * - Novo: compras no cartão são CardPurchase (internas), e gastos gerais só via pagamento de fatura.
 */
export function migrateLocalSnapshot(snapshot: LocalSnapshot): LocalSnapshot {
  let next = snapshot;
  next = migrateCardTransactionsToPurchases(next);
  return next;
}

function migrateCardTransactionsToPurchases(snapshot: LocalSnapshot): LocalSnapshot {
  if (!snapshot.transactions.length) return snapshot;

  const cardsById = new Map<string, CreditCard>(snapshot.creditCards.map((c) => [c.id, c]));

  const purchases: CardPurchase[] = [...(snapshot.cardPurchases ?? [])];
  const txKeep: Transaction[] = [];
  let changed = false;

  for (const tx of snapshot.transactions) {
    const cardId = tx.credit_card_id ?? null;
    if (!cardId) {
      txKeep.push(tx);
      continue;
    }

    // Só migra despesas no cartão.
    if (tx.kind !== "expense") {
      // caso raro: mantemos como está.
      txKeep.push(tx);
      continue;
    }

    // Se o cartão não existe mais, mantém a transação (evita perder referência).
    if (!cardsById.has(cardId)) {
      txKeep.push(tx);
      continue;
    }

    // Evita duplicar: se já existe purchase com id original, não cria outra.
    const already = purchases.some((p) => p.id === tx.id);
    if (!already) {
      const p: CardPurchase = {
        id: tx.id, // reaproveita o id antigo para rastreabilidade
        user_id: tx.user_id,
        credit_card_id: cardId,
        date: tx.date,
        description: tx.description || "(sem descrição)",
        amount_cents: tx.amount_cents,
        total_installments: null,
        installment_amount_cents: null,
        card_tag_ids: tx.card_tag_ids ?? [],
        created_at: tx.created_at,
        updated_at: tx.updated_at,
      };
      purchases.push(p);
    }

    changed = true;
    // Não mantém tx, porque agora compra é interna.
  }

  if (!changed) return snapshot;

  // garante ordenação consistente
  purchases.sort((a, b) => b.date.localeCompare(a.date));

  // opcional: registra um evento de auditoria como transação? (não faremos para não poluir)
  // aqui apenas migra e mantém dados.

  return {
    ...snapshot,
    cardPurchases: purchases,
    transactions: txKeep,
  };
}
