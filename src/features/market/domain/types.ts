export type MarketValues = {
  usd_brl?: number;
  eur_brl?: number;
  cny_brl?: number;
  btc_brl?: number;
  btc_usd?: number;
  btc_dominance?: number;

  // Ouro/Metais
  xau_usd?: number;
  xag_usd?: number;
  gold_silver_ratio?: number;
  gold_brl_oz?: number;
  gold_brl_g?: number;

  // China (manual/API)
  sge_cny_g?: number;
  shanghai_premium_usd_oz?: number;

  // Moeda global
  dxy?: number;
  t10y2y?: number;
  m2_usd_bil?: number;

  // Brasil
  brl_selic_aa?: number;
  brl_ipca_mom?: number;
  brl_ipca_12m?: number;
  brl_selic_real_simple?: number;
  brl_selic_real_fisher?: number;

  brazil_cds_5y_bps?: number;

  // Bolsas globais (nível índice)
  stocks?: Record<string, { value?: number; change_pct?: number }>;
};

// Alguns índices não têm fonte gratuita confiável sem scraping.
// Então damos opção de “valor manual” (atualizado por você) — fica salvo no app.
export type MarketManualOverrides = {
  updatedAt: string;
  sge_cny_g?: number;
  brazil_cds_5y_bps?: number;
};

export type MarketPayload = {
  fetchedAt: string;
  values: MarketValues;
  manual?: MarketManualOverrides;
  source: {
    fx: string;
    crypto: string;
    selic: string;
    fred?: string;
    stooq?: string;
  };
  meta?: {
    stale?: boolean;
    note?: string;
    errors?: string[];
  };
};
