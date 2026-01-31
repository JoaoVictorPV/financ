import localforage from "localforage";
import type {
  Account,
  CardPurchase,
  CardTag,
  CardPayment,
  CreditCard,
  IncomeSource,
  InstallmentPlan,
  Investment,
  InvestmentSnapshot,
  MarketSnapshot,
  RecurringTemplate,
  Tag,
  Transaction,
} from "@/lib/domain/types";

import type { MarketManualOverrides } from "@/features/market/domain/types";

localforage.config({
  name: "fin-sys",
  storeName: "fin_sys",
});

export type LocalSnapshot = {
  tags: Tag[];
  incomeSources: IncomeSource[];
  cardTags: CardTag[];
  account: Account | null;
  transactions: Transaction[];
  creditCards: CreditCard[];
  cardPurchases: CardPurchase[];
  installmentPlans: InstallmentPlan[];
  cardPayments: CardPayment[];
  recurringTemplates: RecurringTemplate[];
  investments: Investment[];
  investmentSnapshots: InvestmentSnapshot[];
  // índices (valores manuais para itens sem fonte gratuita confiável)
  marketManual?: MarketManualOverrides | null;
  // reservado para sync futuro (não usado no MVP)
  marketSnapshots?: MarketSnapshot[];
};

const KEYS = {
  tags: "tags",
  incomeSources: "incomeSources",
  cardTags: "cardTags",
  account: "account",
  transactions: "transactions",
  creditCards: "creditCards",
  cardPurchases: "cardPurchases",
  installmentPlans: "installmentPlans",
  cardPayments: "cardPayments",
  recurringTemplates: "recurringTemplates",
  investments: "investments",
  investmentSnapshots: "investmentSnapshots",
  marketManual: "marketManual",
} as const;

export async function loadAllLocal(): Promise<LocalSnapshot> {
  const [
    tags,
    incomeSources,
    cardTags,
    account,
    transactions,
    creditCards,
    cardPurchases,
    installmentPlans,
    cardPayments,
    recurringTemplates,
    investments,
    investmentSnapshots,
    marketManual,
  ] = await Promise.all([
    localforage.getItem<Tag[]>(KEYS.tags),
    localforage.getItem<IncomeSource[]>(KEYS.incomeSources),
    localforage.getItem<CardTag[]>(KEYS.cardTags),
    localforage.getItem<Account | null>(KEYS.account),
    localforage.getItem<Transaction[]>(KEYS.transactions),
    localforage.getItem<CreditCard[]>(KEYS.creditCards),
    localforage.getItem<CardPurchase[]>(KEYS.cardPurchases),
    localforage.getItem<InstallmentPlan[]>(KEYS.installmentPlans),
    localforage.getItem<CardPayment[]>(KEYS.cardPayments),
    localforage.getItem<RecurringTemplate[]>(KEYS.recurringTemplates),
    localforage.getItem<Investment[]>(KEYS.investments),
    localforage.getItem<InvestmentSnapshot[]>(KEYS.investmentSnapshots),
    localforage.getItem<MarketManualOverrides | null>(KEYS.marketManual),
  ]);

  return {
    tags: tags ?? [],
    incomeSources: incomeSources ?? [],
    cardTags: cardTags ?? [],
    account: account ?? null,
    transactions: transactions ?? [],
    creditCards: creditCards ?? [],
    cardPurchases: cardPurchases ?? [],
    installmentPlans: installmentPlans ?? [],
    cardPayments: cardPayments ?? [],
    recurringTemplates: recurringTemplates ?? [],
    investments: investments ?? [],
    investmentSnapshots: investmentSnapshots ?? [],
    marketManual: marketManual ?? null,
  };
}

export async function saveAllLocal(snapshot: LocalSnapshot): Promise<void> {
  await Promise.all([
    localforage.setItem(KEYS.tags, snapshot.tags),
    localforage.setItem(KEYS.incomeSources, snapshot.incomeSources),
    localforage.setItem(KEYS.cardTags, snapshot.cardTags),
    localforage.setItem(KEYS.account, snapshot.account),
    localforage.setItem(KEYS.transactions, snapshot.transactions),
    localforage.setItem(KEYS.creditCards, snapshot.creditCards),
    localforage.setItem(KEYS.cardPurchases, snapshot.cardPurchases),
    localforage.setItem(KEYS.installmentPlans, snapshot.installmentPlans),
    localforage.setItem(KEYS.cardPayments, snapshot.cardPayments),
    localforage.setItem(KEYS.recurringTemplates, snapshot.recurringTemplates),
    localforage.setItem(KEYS.investments, snapshot.investments),
    localforage.setItem(KEYS.investmentSnapshots, snapshot.investmentSnapshots),
    localforage.setItem(KEYS.marketManual, snapshot.marketManual ?? null),
  ]);
}
