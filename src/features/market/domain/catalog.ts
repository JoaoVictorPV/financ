import type { MarketValues } from "./types";

export type MarketGroupId = "overview" | "fx" | "brasil" | "usa" | "metals" | "energy" | "agri" | "critical" | "crypto";

export type MarketItemId = keyof MarketValues;

export type MarketCatalogItem = {
  id: MarketItemId;
  group: MarketGroupId;
  label: string;
  unit?: string;
  precision?: number;
  badge?: string;
  // Ajuda longa, bem leiga e didática
  help: {
    oQueE: string;
    porQueImporta: string;
    comoLer: string;
    thresholds?: Array<{ when: string; meaning: string }>;
    exemplos?: string[];
  };
};

export type MarketGroup = {
  id: MarketGroupId;
  title: string;
  subtitle: string;
  color: string;
};

export const MARKET_GROUPS: MarketGroup[] = [
  {
    id: "overview",
    title: "Resumo",
    subtitle: "Os principais indicadores para leitura rápida.",
    color: "#22c55e",
  },
  {
    id: "fx",
    title: "Câmbio",
    subtitle: "Moedas, efeito no seu poder de compra e custos.",
    color: "#60a5fa",
  },
  {
    id: "brasil",
    title: "Brasil",
    subtitle: "Juros, inflação e risco-país (impacto direto no dia a dia).",
    color: "#a78bfa",
  },
  {
    id: "usa",
    title: "EUA / Liquidez",
    subtitle: "Juros e stress global (o motor do mercado mundial).",
    color: "#f59e0b",
  },
  {
    id: "metals",
    title: "Metais (Reserva)",
    subtitle: "Ouro, prata e sinais de proteção/recessão.",
    color: "#38bdf8",
  },
  {
    id: "energy",
    title: "Energia",
    subtitle: "Petróleo e energia = inflação, logística, geopolítica.",
    color: "#fb7185",
  },
  {
    id: "agri",
    title: "Agro",
    subtitle: "Commodities agrícolas que mexem com inflação e Brasil.",
    color: "#34d399",
  },
  {
    id: "critical",
    title: "Críticos (ETFs proxy)",
    subtitle: "Urânio, lítio e terras raras (cadeia industrial moderna).",
    color: "#f472b6",
  },
  {
    id: "crypto",
    title: "Cripto",
    subtitle: "Bitcoin como termômetro de apetite por risco e narrativa.",
    color: "#eab308",
  },
];

export const MARKET_ITEMS: MarketCatalogItem[] = [
  // FX
  {
    id: "usd_brl",
    group: "fx",
    label: "USD/BRL",
    precision: 3,
    badge: "Principal",
    help: {
      oQueE: "Quanto 1 dólar (USD) custa em reais (BRL).",
      porQueImporta:
        "Afeta preços de produtos importados, viagens, eletrônicos, combustíveis (via petróleo) e até inflação.",
      comoLer:
        "Se o USD/BRL sobe, o real está perdendo valor. Se cai, o real está ganhando força.",
      thresholds: [
        { when: "Acima de 5,80", meaning: "Pressão forte no Brasil (fiscal, político ou externo)." },
        { when: "Abaixo de 4,80", meaning: "Real mais forte (fluxo externo favorável ou juros altos)." },
      ],
      exemplos: [
        "Se USD sobe e petróleo sobe, tende a pressionar gasolina e custo de vida.",
        "Se USD cai e juros EUA caem, o mundo busca risco (ações emergentes tendem a se beneficiar).",
      ],
    },
  },
  {
    id: "eur_brl",
    group: "fx",
    label: "EUR/BRL",
    precision: 3,
    help: {
      oQueE: "Quanto 1 euro custa em reais.",
      porQueImporta: "Útil para compras/viagens na Europa e leitura de risco europeu.",
      comoLer:
        "Se EUR/BRL sobe: real enfraquece e/ou euro fortalece. Se EUR/USD sobe, a Europa está ganhando força relativa ao dólar.",
      exemplos: [
        "EUR/BRL subindo junto com USD/BRL → problema é Brasil.",
        "EUR/BRL subindo com USD/BRL estável → euro forte (Europa surpreendendo).",
      ],
    },
  },
  {
    id: "cny_brl",
    group: "fx",
    label: "CNY/BRL",
    precision: 3,
    help: {
      oQueE: "Quanto 1 yuan (China) custa em reais.",
      porQueImporta:
        "A China é um motor de demanda por commodities (Brasil exporta muito). Yuan forte geralmente melhora poder de compra chinês.",
      comoLer:
        "Yuan mais fraco pode indicar desaceleração, estímulos ou tensão comercial. Pode afetar minério/soja.",
      exemplos: [
        "CNY fraco + cobre caindo → risco de desaceleração chinesa.",
      ],
    },
  },
  {
    id: "jpy_brl",
    group: "fx",
    label: "JPY/BRL",
    precision: 5,
    help: {
      oQueE: "Quanto 1 iene custa em reais.",
      porQueImporta: "Iene é moeda de financiamento. Movimentos fortes podem sinalizar mudança de risco global.",
      comoLer: "JPY forte pode indicar aversão ao risco. JPY fraco pode indicar juros japoneses baixos e carry trade.",
      exemplos: ["JPY fortalecendo + bolsa caindo = fuga para segurança."],
    },
  },

  // Brasil
  {
    id: "brl_selic_aa",
    group: "brasil",
    label: "Selic (a.a.)",
    precision: 2,
    help: {
      oQueE: "Taxa básica de juros do Brasil.",
      porQueImporta: "Define custo do crédito, rendimento de renda fixa e influencia o dólar no Brasil.",
      comoLer:
        "Selic alta tende a segurar inflação e fortalecer o real (atrai capital), mas pode travar a economia.",
      thresholds: [
        { when: "> 13%", meaning: "Aperto forte; crédito caro; foco em desinflacionar/defender câmbio." },
        { when: "< 9%", meaning: "Cenário mais leve; bom para crédito e ações, mas depende da inflação." },
      ],
      exemplos: [
        "Selic sobe e USD/BRL não cai → mercado não está comprando a política; risco fiscal alto.",
      ],
    },
  },
  {
    id: "brl_ipca_12m",
    group: "brasil",
    label: "IPCA 12m",
    precision: 2,
    help: {
      oQueE: "Inflação oficial acumulada em 12 meses.",
      porQueImporta: "Mostra perda de poder de compra e guia decisões de juros.",
      comoLer:
        "Se IPCA sobe por vários meses, o BC tende a manter/subir juros. Se cai, abre espaço para cortes.",
      thresholds: [
        { when: "> 6%", meaning: "Pressão inflacionária relevante." },
        { when: "< 4%", meaning: "Inflação mais controlada (depende do câmbio e alimentos)." },
      ],
    },
  },
  {
    id: "brazil_cds_5y_bps",
    group: "brasil",
    label: "CDS Brasil 5Y",
    precision: 0,
    unit: "bps",
    badge: "Risco-país",
    help: {
      oQueE:
        "Seguro contra calote do Brasil (5 anos). Quanto maior, maior a percepção de risco.",
      porQueImporta:
        "É um termômetro do medo internacional sobre o Brasil. Sobe com crise fiscal/política e com stress global.",
      comoLer:
        "Se o CDS sobe, investidores exigem mais prêmio para emprestar ao país. Isso pode pressionar dólar e juros locais.",
      thresholds: [
        { when: "< 200", meaning: "Normal/ok" },
        { when: "200–250", meaning: "Atenção" },
        { when: "> 250", meaning: "Estresse" },
      ],
      exemplos: [
        "CDS sobe + USD/BRL sobe → risco local (Brasil).",
        "CDS sobe + VIX sobe → choque global.",
      ],
    },
  },

  // EUA / Liquidez
  {
    id: "dxy",
    group: "usa",
    label: "DXY (Índice do Dólar)",
    precision: 2,
    help: {
      oQueE: "Força do dólar contra um conjunto de moedas fortes.",
      porQueImporta:
        "Dólar forte aperta condições financeiras globais: emergentes sofrem, commodities podem cair e juros globais sobem.",
      comoLer:
        "DXY subindo = dólar ganhando força; geralmente piora para ativos de risco. DXY caindo = alívio global.",
      thresholds: [
        { when: "> 110", meaning: "Stress de liquidez / dólar muito forte." },
        { when: "< 100", meaning: "Dólar mais fraco; melhora para emergentes." },
      ],
    },
  },
  {
    id: "t10y2y",
    group: "usa",
    label: "Curva EUA (10Y-2Y)",
    precision: 2,
    unit: "p.p.",
    badge: "Recessão",
    help: {
      oQueE: "Diferença entre juros de 10 anos e 2 anos nos EUA.",
      porQueImporta: "Quando fica negativa, historicamente antecipa recessões.",
      comoLer:
        "Se a curva inverte (negativa), o mercado espera que juros caiam no futuro por desaceleração.",
      thresholds: [
        { when: "< 0", meaning: "Curva invertida (alerta)" },
        { when: "> 1", meaning: "Curva normal e otimista" },
      ],
    },
  },
  {
    id: "vix",
    group: "usa",
    label: "VIX (Medo)",
    precision: 2,
    badge: "Stress",
    help: {
      oQueE: "Índice de volatilidade implícita do S&P 500.",
      porQueImporta:
        "VIX é um termômetro de medo. Quando sobe muito, investidores buscam proteção e vendem risco.",
      comoLer:
        "VIX alto = mercado nervoso. VIX baixo = complacência (às vezes perigosa).",
      thresholds: [
        { when: "> 30", meaning: "Estresse elevado" },
        { when: "> 40", meaning: "Pânico" },
        { when: "< 15", meaning: "Calma (pode ser complacência)" },
      ],
    },
  },

  // Metais
  {
    id: "xau_usd",
    group: "metals",
    label: "Ouro (XAU/USD)",
    precision: 2,
    unit: "USD/oz",
    badge: "Reserva",
    help: {
      oQueE: "Preço do ouro em dólar por onça.",
      porQueImporta: "Ouro é reserva de valor e tende a se destacar em stress e inflação.",
      comoLer:
        "Ouro sobe quando juros reais caem e quando risco aumenta. Pode cair em venda forçada (crise de liquidez).",
      exemplos: [
        "Ouro sobe + VIX sobe = fuga para segurança.",
        "Ouro cai + VIX sobe = venda forçada (liquidez).",
      ],
    },
  },
  {
    id: "shanghai_premium_usd_oz",
    group: "metals",
    label: "Premium Xangai (Ouro)",
    precision: 2,
    unit: "USD/oz",
    badge: "China",
    help: {
      oQueE:
        "Diferença entre o ouro na China (SGE) e o ouro spot internacional (XAU/USD).",
      porQueImporta:
        "Mostra demanda local chinesa e restrições/fluxos. Premium alto = China pagando mais por ouro.",
      comoLer:
        "Premium positivo e crescente pode indicar demanda forte, tensão financeira ou restrição de oferta local.",
      exemplos: ["Premium subindo com dólar forte = demanda chinesa resiliente."],
    },
  },

  // Energia
  {
    id: "wti_usd_bbl",
    group: "energy",
    label: "Petróleo (WTI)",
    precision: 2,
    unit: "USD/bbl",
    badge: "Inflação",
    help: {
      oQueE: "Preço do barril de petróleo WTI (referência EUA).",
      porQueImporta:
        "Petróleo afeta transporte, energia, produção e inflação. Também reflete geopolítica.",
      comoLer:
        "Petróleo subindo tende a pressionar inflação e juros. Queda forte pode indicar desaceleração.",
      thresholds: [
        { when: "> 100", meaning: "Pressão inflacionária global tende a aumentar." },
        { when: "< 60", meaning: "Pode sinalizar desaceleração global (ou aumento de oferta)." },
      ],
    },
  },
  {
    id: "wti_brl_bbl",
    group: "energy",
    label: "Petróleo (BRL)",
    precision: 2,
    unit: "BRL/bbl",
    help: {
      oQueE: "WTI convertido para reais (efeito do dólar).",
      porQueImporta: "Mostra impacto potencial no Brasil, combinando petróleo + câmbio.",
      comoLer:
        "Se WTI em USD está estável mas em BRL sobe, o problema é o câmbio (real fraco).",
    },
  },

  // Críticos
  {
    id: "etf_remx_usd",
    group: "critical",
    label: "Terras Raras (REMX)",
    precision: 2,
    unit: "USD",
    badge: "Proxy",
    help: {
      oQueE:
        "ETF que representa empresas ligadas a terras raras (insumos críticos).",
      porQueImporta:
        "Terras raras são essenciais para eletrônicos, motores, defesa e transição energética.",
      comoLer:
        "Alta pode indicar demanda industrial/tecnologia ou restrição de oferta. Quedas podem indicar ciclo fraco.",
    },
  },
  {
    id: "etf_lit_usd",
    group: "critical",
    label: "Lítio (LIT)",
    precision: 2,
    unit: "USD",
    badge: "Proxy",
    help: {
      oQueE: "ETF que representa cadeia de baterias e lítio.",
      porQueImporta: "Baterias são o coração da transição energética e veículos elétricos.",
      comoLer:
        "Alta pode indicar expectativa de demanda por elétricos. Queda pode indicar excesso de oferta/ciclo fraco.",
    },
  },
  {
    id: "etf_ura_usd",
    group: "critical",
    label: "Urânio (URA)",
    precision: 2,
    unit: "USD",
    badge: "Proxy",
    help: {
      oQueE: "ETF ligado ao setor de urânio e energia nuclear.",
      porQueImporta: "Nuclear volta a ganhar espaço como energia estável e de baixa emissão.",
      comoLer:
        "Alta pode indicar ciclo nuclear ou demanda energética. Queda pode indicar risco/regulação.",
    },
  },
];

export function groupItems() {
  const map = new Map<MarketGroupId, MarketCatalogItem[]>();
  for (const g of MARKET_GROUPS) map.set(g.id, []);
  for (const it of MARKET_ITEMS) {
    const arr = map.get(it.group) ?? [];
    arr.push(it);
    map.set(it.group, arr);
  }
  return map;
}