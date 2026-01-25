"use client";

import { create } from "zustand";
import type {
  Account,
  CardPayment,
  CreditCard,
  InstallmentPlan,
  Investment,
  InvestmentSnapshot,
  RecurringTemplate,
  Tag,
  Transaction,
} from "@/lib/domain/types";
import { seedSystemTags } from "@/state/utils/seedSystemTags";
import {
  loadAllLocal,
  saveAllLocal,
  type LocalSnapshot,
} from "@/state/utils/localPersistence";
import { uuid } from "@/lib/ids";
import { todayYMD } from "@/lib/dates";

type AppState = {
  bootstrapped: boolean;

  tags: Tag[];
  account: Account | null;
  transactions: Transaction[];
  creditCards: CreditCard[];
  installmentPlans: InstallmentPlan[];
  recurringTemplates: RecurringTemplate[];
  investments: Investment[];
  investmentSnapshots: InvestmentSnapshot[];
  cardPayments: CardPayment[];

  bootstrap: () => Promise<void>;
  replaceAll: (snapshot: LocalSnapshot) => Promise<void>;

  // Tags
  addTag: (input: Pick<Tag, "name" | "type" | "color" | "icon">) => Promise<Tag>;
  updateTag: (
    id: string,
    patch: Partial<Pick<Tag, "name" | "type" | "color" | "icon">>,
  ) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Conta
  setAccountBalanceCents: (balanceCents: number) => Promise<void>;

  // Transações
  addTransaction: (
    input: Pick<Transaction, "kind" | "amount_cents" | "date" | "description" | "tags" | "is_recurring" | "credit_card_id">,
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    patch: Partial<
      Pick<
        Transaction,
        "kind" | "amount_cents" | "date" | "description" | "tags" | "is_recurring" | "credit_card_id"
      >
    >,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Cartões
  addCreditCard: (
    input: Pick<CreditCard, "name" | "statement_closing_day" | "statement_due_day" | "brand" | "last4">,
  ) => Promise<CreditCard>;
  deleteCreditCard: (id: string) => Promise<void>;

  // Parcelamento
  addInstallmentPlan: (
    input: Pick<
      InstallmentPlan,
      "credit_card_id" | "total_amount_cents" | "total_installments" | "installment_amount_cents" | "start_date" | "description" | "tags"
    >,
  ) => Promise<InstallmentPlan>;

  // Pagamento de fatura (integral)
  markStatementPaid: (input: {
    creditCardId: string;
    year: number;
    month: number;
    paidAt: string;
    amountCents: number;
  }) => Promise<CardPayment>;

  // Recorrências
  addRecurringTemplate: (
    input: Omit<
      RecurringTemplate,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ) => Promise<RecurringTemplate>;
  updateRecurringTemplate: (
    id: string,
    patch: Partial<
      Omit<
        RecurringTemplate,
        "id" | "user_id" | "created_at" | "updated_at"
      >
    >,
  ) => Promise<void>;
  deleteRecurringTemplate: (id: string) => Promise<void>;

  // Investimentos
  addInvestment: (
    input: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">,
  ) => Promise<Investment>;
  updateInvestment: (
    id: string,
    patch: Partial<Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">>,
  ) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addInvestmentSnapshot: (
    input: Omit<InvestmentSnapshot, "id" | "user_id" | "created_at">,
  ) => Promise<InvestmentSnapshot>;
};

function snapshotFromState(s: AppState): LocalSnapshot {
  return {
    tags: s.tags,
    account: s.account,
    transactions: s.transactions,
    creditCards: s.creditCards,
    installmentPlans: s.installmentPlans,
    cardPayments: s.cardPayments,
    recurringTemplates: s.recurringTemplates,
    investments: s.investments,
    investmentSnapshots: s.investmentSnapshots,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  bootstrapped: false,
  tags: [],
  account: null,
  transactions: [],
  creditCards: [],
  installmentPlans: [],
  cardPayments: [],
  recurringTemplates: [],
  investments: [],
  investmentSnapshots: [],

  bootstrap: async () => {
    if (get().bootstrapped) return;

    const local = await loadAllLocal();

    // Se não existe nada ainda, cria tags padrão
    let seeded = local.tags.length ? local : await seedSystemTags(local);

    // Cria conta padrão se não existir
    if (!seeded.account) {
      const now = new Date().toISOString();
      seeded = {
        ...seeded,
        account: {
          id: uuid(),
          user_id: "local",
          name: "Conta Corrente",
          type: "checking",
          currency: "BRL",
          current_balance_cents: 0,
          balance_updated_at: now,
          created_at: now,
          updated_at: now,
        },
      };
    }

    set({
      bootstrapped: true,
      tags: seeded.tags,
      account: seeded.account,
      transactions: seeded.transactions,
      creditCards: seeded.creditCards,
      installmentPlans: seeded.installmentPlans,
      cardPayments: seeded.cardPayments,
      recurringTemplates: seeded.recurringTemplates,
      investments: seeded.investments,
      investmentSnapshots: seeded.investmentSnapshots,
    });

    await saveAllLocal(seeded);
  },

  replaceAll: async (snapshot) => {
    set({
      tags: snapshot.tags,
      account: snapshot.account,
      transactions: snapshot.transactions,
      creditCards: snapshot.creditCards,
      installmentPlans: snapshot.installmentPlans,
      cardPayments: snapshot.cardPayments,
      recurringTemplates: snapshot.recurringTemplates,
      investments: snapshot.investments,
      investmentSnapshots: snapshot.investmentSnapshots,
    });
    await saveAllLocal(snapshot);
  },

  addTag: async (input) => {
    const now = new Date().toISOString();
    const tag: Tag = {
      id: uuid(),
      user_id: "local",
      name: input.name.trim(),
      type: input.type,
      color: input.color,
      icon: input.icon ?? null,
      is_system: false,
      created_at: now,
      updated_at: now,
    };
    const next = [...get().tags, tag].sort((a, b) => a.name.localeCompare(b.name));
    set({ tags: next });
    await saveAllLocal({ ...snapshotFromState(get()), tags: next });
    return tag;
  },

  updateTag: async (id, patch) => {
    const now = new Date().toISOString();
    const next = get().tags.map((t) =>
      t.id === id ? { ...t, ...patch, updated_at: now } : t,
    );
    set({ tags: next });
    await saveAllLocal({ ...snapshotFromState(get()), tags: next });
  },

  deleteTag: async (id) => {
    const next = get().tags.filter((t) => t.id !== id);
    // também remove tag das transações e templates
    const txNext = get().transactions.map((tx) => ({
      ...tx,
      tags: tx.tags.filter((tid) => tid !== id),
    }));
    const recNext = get().recurringTemplates.map((rt) => ({
      ...rt,
      tags: rt.tags.filter((tid) => tid !== id),
    }));
    set({ tags: next, transactions: txNext, recurringTemplates: recNext });
    await saveAllLocal({
      ...snapshotFromState(get()),
      tags: next,
      transactions: txNext,
      recurringTemplates: recNext,
    });
  },

  setAccountBalanceCents: async (balanceCents) => {
    const now = new Date().toISOString();
    const acc = get().account;
    if (!acc) return;
    const next: Account = {
      ...acc,
      current_balance_cents: Math.max(0, Math.round(balanceCents)),
      balance_updated_at: now,
      updated_at: now,
    };
    set({ account: next });
    await saveAllLocal({ ...snapshotFromState(get()), account: next });
  },

  addTransaction: async (input) => {
    const now = new Date().toISOString();
    const tx: Transaction = {
      id: uuid(),
      user_id: "local",
      kind: input.kind,
      amount_cents: input.amount_cents,
      currency: "BRL",
      date: input.date || todayYMD(),
      description: input.description?.trim() || "",
      tags: input.tags ?? [],
      is_recurring: !!input.is_recurring,
      payment_method: input.credit_card_id ? "credit" : "pix",
      account_id: null,
      credit_card_id: input.credit_card_id ?? null,
      installment_plan_id: null,
      created_at: now,
      updated_at: now,
    };
    const next = [tx, ...get().transactions].sort((a, b) => b.date.localeCompare(a.date));
    set({ transactions: next });
    await saveAllLocal({ ...snapshotFromState(get()), transactions: next });
    return tx;
  },

  updateTransaction: async (id, patch) => {
    const now = new Date().toISOString();
    const next = get().transactions.map((t) =>
      t.id === id
        ? {
            ...t,
            ...patch,
            payment_method: patch.credit_card_id ? "credit" : t.payment_method,
            updated_at: now,
          }
        : t,
    );
    set({ transactions: next });
    await saveAllLocal({ ...snapshotFromState(get()), transactions: next });
  },

  deleteTransaction: async (id) => {
    const next = get().transactions.filter((t) => t.id !== id);
    set({ transactions: next });
    await saveAllLocal({ ...snapshotFromState(get()), transactions: next });
  },

  addCreditCard: async (input) => {
    const now = new Date().toISOString();
    const card: CreditCard = {
      id: uuid(),
      user_id: "local",
      name: input.name.trim(),
      brand: input.brand ?? null,
      last4: input.last4 ?? null,
      statement_closing_day: input.statement_closing_day,
      statement_due_day: input.statement_due_day ?? null,
      created_at: now,
      updated_at: now,
    };
    const next = [...get().creditCards, card].sort((a, b) => a.name.localeCompare(b.name));
    set({ creditCards: next });
    await saveAllLocal({ ...snapshotFromState(get()), creditCards: next });
    return card;
  },

  deleteCreditCard: async (id) => {
    const cards = get().creditCards.filter((c) => c.id !== id);
    const plans = get().installmentPlans.filter((p) => p.credit_card_id !== id);
    const tx = get().transactions.map((t) =>
      t.credit_card_id === id ? { ...t, credit_card_id: null } : t,
    );
    const payments = get().cardPayments.filter((p) => !p.statement_id.startsWith(`${id}:`));
    set({ creditCards: cards, installmentPlans: plans, transactions: tx, cardPayments: payments });
    await saveAllLocal({
      ...snapshotFromState(get()),
      creditCards: cards,
      installmentPlans: plans,
      transactions: tx,
      cardPayments: payments,
    });
  },

  addInstallmentPlan: async (input) => {
    const now = new Date().toISOString();
    const plan: InstallmentPlan = {
      id: uuid(),
      user_id: "local",
      credit_card_id: input.credit_card_id,
      total_amount_cents: input.total_amount_cents,
      total_installments: input.total_installments,
      installment_amount_cents: input.installment_amount_cents,
      start_date: input.start_date,
      description: input.description?.trim() || "",
      tags: input.tags ?? [],
      created_at: now,
      updated_at: now,
    };
    const next = [plan, ...get().installmentPlans].sort((a, b) => b.start_date.localeCompare(a.start_date));
    set({ installmentPlans: next });
    await saveAllLocal({ ...snapshotFromState(get()), installmentPlans: next });
    return plan;
  },

  markStatementPaid: async (input) => {
    const now = new Date().toISOString();
    // statement_id será "cardId:YYYY-MM" no modo local (evita criar tabela de statements agora)
    const statementId = `${input.creditCardId}:${input.year}-${String(input.month).padStart(2, "0")}`;
    const payment: CardPayment = {
      id: uuid(),
      user_id: "local",
      statement_id: statementId,
      paid_at: input.paidAt,
      paid_amount_cents: input.amountCents,
      method: "transfer",
      notes: null,
      created_at: now,
    };
    const next = [payment, ...get().cardPayments];
    set({ cardPayments: next });
    await saveAllLocal({ ...snapshotFromState(get()), cardPayments: next });
    return payment;
  },

  addRecurringTemplate: async (input) => {
    const now = new Date().toISOString();
    const rt: RecurringTemplate = {
      id: uuid(),
      user_id: "local",
      kind: input.kind,
      amount_cents: input.amount_cents,
      currency: "BRL",
      description: input.description?.trim() || "",
      tags: input.tags ?? [],
      frequency: input.frequency,
      day_of_month: input.day_of_month ?? null,
      monthly_rule: input.monthly_rule ?? null,
      day_of_week: input.day_of_week ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      created_at: now,
      updated_at: now,
    };
    const next = [rt, ...get().recurringTemplates].sort((a, b) => b.start_date.localeCompare(a.start_date));
    set({ recurringTemplates: next });
    await saveAllLocal({ ...snapshotFromState(get()), recurringTemplates: next });
    return rt;
  },

  updateRecurringTemplate: async (id, patch) => {
    const now = new Date().toISOString();
    const next = get().recurringTemplates.map((r) =>
      r.id === id ? { ...r, ...patch, updated_at: now } : r,
    );
    set({ recurringTemplates: next });
    await saveAllLocal({ ...snapshotFromState(get()), recurringTemplates: next });
  },

  deleteRecurringTemplate: async (id) => {
    const next = get().recurringTemplates.filter((r) => r.id !== id);
    set({ recurringTemplates: next });
    await saveAllLocal({ ...snapshotFromState(get()), recurringTemplates: next });
  },

  addInvestment: async (input) => {
    const now = new Date().toISOString();
    const inv: Investment = {
      id: uuid(),
      user_id: "local",
      type: input.type,
      name: input.name.trim(),
      current_value_cents: input.current_value_cents,
      currency: "BRL",
      expected_monthly_rate: input.expected_monthly_rate ?? null,
      expected_annual_rate: input.expected_annual_rate ?? null,
      expected_ir_rate: input.expected_ir_rate ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      monthly_contribution: input.monthly_contribution ?? null,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    const next = [inv, ...get().investments].sort((a, b) => a.name.localeCompare(b.name));
    set({ investments: next });
    await saveAllLocal({ ...snapshotFromState(get()), investments: next });
    return inv;
  },

  updateInvestment: async (id, patch) => {
    const now = new Date().toISOString();
    const next = get().investments.map((i) =>
      i.id === id ? { ...i, ...patch, updated_at: now } : i,
    );
    set({ investments: next });
    await saveAllLocal({ ...snapshotFromState(get()), investments: next });
  },

  deleteInvestment: async (id) => {
    const inv = get().investments.filter((i) => i.id !== id);
    const snaps = get().investmentSnapshots.filter((s) => s.investment_id !== id);
    set({ investments: inv, investmentSnapshots: snaps });
    await saveAllLocal({
      ...snapshotFromState(get()),
      investments: inv,
      investmentSnapshots: snaps,
    });
  },

  addInvestmentSnapshot: async (input) => {
    const now = new Date().toISOString();
    const snap: InvestmentSnapshot = {
      id: uuid(),
      user_id: "local",
      investment_id: input.investment_id,
      date: input.date,
      value_cents: input.value_cents,
      notes: input.notes ?? null,
      created_at: now,
    };
    const next = [snap, ...get().investmentSnapshots].sort((a, b) => b.date.localeCompare(a.date));
    set({ investmentSnapshots: next });
    await saveAllLocal({ ...snapshotFromState(get()), investmentSnapshots: next });
    return snap;
  },
}));
