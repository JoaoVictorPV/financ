export type MarketValues = {
  usd_brl?: number;
  eur_brl?: number;
  cny_brl?: number;
  btc_brl?: number;
  gold_usd?: number;
  gold_brl?: number;
  brl_selic?: number;
};

export type MarketPayload = {
  fetchedAt: string;
  values: MarketValues;
  source: {
    fx: string;
    crypto: string;
    selic: string;
  };
  meta?: {
    stale?: boolean;
    note?: string;
  };
};
