export type MarketValues = {
  usd_brl?: number;
  eur_brl?: number;
  cny_brl?: number;
  jpy_brl?: number;
  usd_jpy?: number;
  usd_cny?: number;
  btc_brl?: number;
  btc_usd?: number;
  btc_dominance?: number;

  // Cripto (altcoins)
  eth_brl?: number;
  eth_usd?: number;
  sol_brl?: number;
  sol_usd?: number;

  // Ouro/Metais
  xau_usd?: number;
  xag_usd?: number;
  gold_silver_ratio?: number;
  gold_brl_oz?: number;
  gold_brl_g?: number;
  silver_brl_oz?: number;
  silver_brl_g?: number;

  // China (manual/API)
  sge_cny_g?: number;
  sge_usd_oz?: number;
  shanghai_premium_usd_oz?: number;

  // Moeda global
  dxy?: number;
  t10y2y?: number;
  m2_usd_bil?: number;

  // EUA (juros / stress)
  us2y?: number;
  us10y?: number;
  fed_funds?: number;
  vix?: number;
  tips10y_real_yield?: number;

  // Bolsas / índices
  sp500?: number;
  nasdaq100?: number;
  dowjones?: number;
  ibov?: number;

  // Variação diária (percentual)
  sp500_change_pct?: number;
  nasdaq100_change_pct?: number;
  dowjones_change_pct?: number;
  ibov_change_pct?: number;

  // Brasil
  brl_selic_aa?: number;
  brl_ipca_mom?: number;
  brl_ipca_12m?: number;
  brl_selic_real_simple?: number;
  brl_selic_real_fisher?: number;

  brazil_cds_5y_bps?: number;

  // Commodities (USD)
  wti_usd_bbl?: number;
  wti_brl_bbl?: number;
  natgas_usd_mmbtu?: number;
  copper_usd?: number;
  wheat_usd?: number;
  corn_usd?: number;
  soy_usd?: number;
  sugar_usd?: number;
  coffee_usd?: number;
  cotton_usd?: number;
  platinum_usd_oz?: number;
  palladium_usd_oz?: number;
  gasoline_usd?: number;
  heating_oil_usd?: number;
  aluminum_usd?: number;
  nickel_usd?: number;

  // “Elementos críticos” via ETFs (proxy)
  etf_ura_usd?: number;
  etf_lit_usd?: number;
  etf_remx_usd?: number;

  // Bolsas globais (nível índice)
  stocks?: Record<string, { value?: number; change_pct?: number }>;
};

// Alguns índices não têm fonte gratuita confiável sem scraping.
// Então damos opção de “valor manual” (atualizado por você) — fica salvo no app.
export type MarketManualOverrides = {
  updatedAt: string;
  sge_cny_g?: number;
  brazil_cds_5y_bps?: number;
  ibov_index?: number;
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

export type MarketHistoryPoint = [string, number];

export type MarketHistorySeries = {
  id: string;
  label: string;
  unit: string;
  points: MarketHistoryPoint[];
};

export type MarketHistoryPayload = {
  fetchedAt: string;
  series: MarketHistorySeries[];
  meta?: {
    note?: string;
    errors?: string[];
  };
};
