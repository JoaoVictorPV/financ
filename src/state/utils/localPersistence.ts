import localforage from "localforage";
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

localforage.config({
  name: "fin-sys",
  storeName: "fin_sys",
});

export type LocalSnapshot = {
  tags: Tag[];
  account: Account | null;
  transactions: Transaction[];
  creditCards: CreditCard[];
  installmentPlans: InstallmentPlan[];
  cardPayments: CardPayment[];
  recurringTemplates: RecurringTemplate[];
  investments: Investment[];
  investmentSnapshots: InvestmentSnapshot[];
};

const KEYS = {
  tags: "tags",
  account: "account",
  transactions: "transactions",
  creditCards: "creditCards",
  installmentPlans: "installmentPlans",
  cardPayments: "cardPayments",
  recurringTemplates: "recurringTemplates",
  investments: "investments",
  investmentSnapshots: "investmentSnapshots",
} as const;

export async function loadAllLocal(): Promise<LocalSnapshot> {
  const [
    tags,
    account,
    transactions,
    creditCards,
    installmentPlans,
    cardPayments,
    recurringTemplates,
    investments,
    investmentSnapshots,
  ] = await Promise.all([
    localforage.getItem<Tag[]>(KEYS.tags),
    localforage.getItem<Account | null>(KEYS.account),
    localforage.getItem<Transaction[]>(KEYS.transactions),
    localforage.getItem<CreditCard[]>(KEYS.creditCards),
    localforage.getItem<InstallmentPlan[]>(KEYS.installmentPlans),
    localforage.getItem<CardPayment[]>(KEYS.cardPayments),
    localforage.getItem<RecurringTemplate[]>(KEYS.recurringTemplates),
    localforage.getItem<Investment[]>(KEYS.investments),
    localforage.getItem<InvestmentSnapshot[]>(KEYS.investmentSnapshots),
  ]);

  return {
    tags: tags ?? [],
    account: account ?? null,
    transactions: transactions ?? [],
    creditCards: creditCards ?? [],
    installmentPlans: installmentPlans ?? [],
    cardPayments: cardPayments ?? [],
    recurringTemplates: recurringTemplates ?? [],
    investments: investments ?? [],
    investmentSnapshots: investmentSnapshots ?? [],
  };
}

export async function saveAllLocal(snapshot: LocalSnapshot): Promise<void> {
  await Promise.all([
    localforage.setItem(KEYS.tags, snapshot.tags),
    localforage.setItem(KEYS.account, snapshot.account),
    localforage.setItem(KEYS.transactions, snapshot.transactions),
    localforage.setItem(KEYS.creditCards, snapshot.creditCards),
    localforage.setItem(KEYS.installmentPlans, snapshot.installmentPlans),
    localforage.setItem(KEYS.cardPayments, snapshot.cardPayments),
    localforage.setItem(KEYS.recurringTemplates, snapshot.recurringTemplates),
    localforage.setItem(KEYS.investments, snapshot.investments),
    localforage.setItem(KEYS.investmentSnapshots, snapshot.investmentSnapshots),
  ]);
}
