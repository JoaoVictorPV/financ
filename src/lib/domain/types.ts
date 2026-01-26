export type Currency = "BRL";

export type TagType = "expense" | "income" | "both";

export type TransactionKind = "expense" | "income";

export type PaymentMethod = "cash" | "pix" | "debit" | "credit" | "transfer";

export type RecurringFrequency = "monthly" | "weekly" | "yearly";
export type MonthlyRule = "dayOfMonth" | "lastBusinessDay";

export type CardStatementStatus = "open" | "closed" | "paid";

export type InvestmentType =
  | "tesouro"
  | "cdb"
  | "bolsa"
  | "poupanca"
  | "consorcio"
  | "bonus"
  | "misc";

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  type: TagType;
  color: string;
  icon?: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

// Fontes de renda (tags próprias para entradas)
export type IncomeSource = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

// Tags internas de cartão (não entram nos gráficos gerais)
export type CardTag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string | null;
  created_at: string;
  updated_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: "checking" | "wallet" | "other";
  currency: Currency;
  current_balance_cents: number;
  balance_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  kind: TransactionKind;
  amount_cents: number;
  currency: Currency;
  date: string; // YYYY-MM-DD
  description: string;
  tags: string[];
  is_recurring: boolean;
  payment_method: PaymentMethod;
  account_id?: string | null;
  credit_card_id?: string | null;
  // tags internas do cartão (apenas quando credit_card_id != null)
  card_tag_ids?: string[] | null;
  // fonte de renda (apenas quando kind=income)
  income_source_id?: string | null;
  installment_plan_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  brand?: string | null;
  last4?: string | null;
  // tag global criada automaticamente para registrar pagamento de fatura como despesa
  payment_tag_id?: string | null;
  statement_closing_day: number;
  statement_due_day?: number | null;
  created_at: string;
  updated_at: string;
};

// Compra de cartão (não entra em gastos gerais; apenas no módulo de cartão)
export type CardPurchase = {
  id: string;
  user_id: string;
  credit_card_id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount_cents: number;
  // parcelamento opcional
  total_installments?: number | null;
  installment_amount_cents?: number | null;
  // tags internas do cartão
  card_tag_ids: string[];
  created_at: string;
  updated_at: string;
};

export type InstallmentPlan = {
  id: string;
  user_id: string;
  credit_card_id: string;
  total_amount_cents: number;
  total_installments: number;
  installment_amount_cents: number;
  start_date: string; // YYYY-MM-DD
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CardStatement = {
  id: string;
  user_id: string;
  credit_card_id: string;
  year: number;
  month: number; // 1..12
  closing_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  total_amount_cents: number;
  status: CardStatementStatus;
  created_at: string;
  updated_at: string;
};

export type CardPayment = {
  id: string;
  user_id: string;
  statement_id: string;
  paid_at: string;
  paid_amount_cents: number;
  method?: "pix" | "debit" | "transfer" | null;
  notes?: string | null;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  type: InvestmentType;
  name: string;
  current_value_cents: number;
  currency: Currency;
  expected_monthly_rate?: number | null;
  expected_annual_rate?: number | null;
  expected_ir_rate?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  monthly_contribution?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type InvestmentSnapshot = {
  id: string;
  user_id: string;
  investment_id: string;
  date: string;
  value_cents: number;
  notes?: string | null;
  created_at: string;
};

export type RecurringTemplate = {
  id: string;
  user_id: string;
  kind: TransactionKind;
  amount_cents: number;
  currency: Currency;
  description: string;
  tags: string[];
  frequency: RecurringFrequency;
  day_of_month?: number | null;
  monthly_rule?: MonthlyRule | null;
  day_of_week?: number | null;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketSnapshot = {
  id: string;
  user_id: string;
  datetime: string;
  values: Record<string, number | null>;
  source_meta?: Record<string, unknown> | null;
  created_at: string;
};
