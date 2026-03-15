import type { MarketValues } from "./types";

export type MarketGroupId =
  | "overview"
  | "fx"
  | "brasil"
  | "usa"
  | "equities"
  | "metals"
  | "energy"
  | "agri"
  | "critical"
  | "crypto";

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
    id: "equities",
    title: "Bolsas",
    subtitle: "Índices das principais bolsas (termômetro de risco).",
    color: "#f97316",
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

// Curadoria do "Resumo": leitura rápida (sem lotar a tela).
export const OVERVIEW_IDS: Array<keyof MarketValues> = [
  "usd_brl",
  "eur_brl",
  "cny_brl",
  "btc_usd",
  "brl_selic_aa",
  "xau_usd",
  "xag_usd",
  "wti_usd_bbl",
  "eth_usd",
  "brl_ipca_12m",
  "sp500_change_pct",
  "ibov_change_pct",
  "dowjones_change_pct",
];

export const MARKET_ITEMS: MarketCatalogItem[] = [
  // Resumo (os mesmos itens também aparecem em suas categorias)
  {
    id: "usd_brl",
    group: "overview",
    label: "USD/BRL",
    precision: 3,
    badge: "Principal",
    help: {
      oQueE: "Quanto 1 dólar (USD) custa em reais (BRL).",
      porQueImporta:
        "Afeta importados, viagens, eletrônicos, combustível (via petróleo) e inflação. É um dos melhores termômetros rápidos do Brasil.",
      comoLer:
        "Se sobe, o real enfraquece. Se cai, o real fortalece. Confirme com CDS/juros para entender se é problema local ou global.",
    },
  },

  {
    id: "eur_brl",
    group: "overview",
    label: "EUR/BRL",
    precision: 3,
    help: {
      oQueE: "Quanto 1 euro (EUR) custa em reais (BRL).",
      porQueImporta: "Afeta viagens/compras na Europa e serve como termômetro de força do euro.",
      comoLer: "Se EUR/BRL sobe junto com USD/BRL, normalmente é Real fraco. Se EUR/BRL sobe sozinho, euro está fortalecendo.",
    },
  },

  {
    id: "cny_brl",
    group: "overview",
    label: "CNY/BRL",
    precision: 3,
    help: {
      oQueE: "Quanto 1 yuan (CNY) custa em reais (BRL).",
      porQueImporta: "China impacta commodities (Brasil exporta muito). Yuan forte tende a favorecer demanda.",
      comoLer: "Se CNY enfraquece vs USD (USD/CNY sobe) e commodities caem, pode indicar desaceleração.",
    },
  },
  {
    id: "brl_selic_aa",
    group: "overview",
    label: "Selic (a.a.)",
    precision: 2,
    badge: "Brasil",
    help: {
      oQueE: "Taxa básica de juros do Brasil.",
      porQueImporta: "Determina custo de crédito e retorno de renda fixa. Impacta o câmbio.",
      comoLer: "Selic alta segura inflação e tende a segurar o dólar, mas pode travar a economia.",
    },
  },
  {
    id: "wti_usd_bbl",
    group: "overview",
    label: "Petróleo (WTI)",
    precision: 2,
    badge: "Inflação",
    help: {
      oQueE: "Preço do barril de petróleo.",
      porQueImporta: "Pressiona inflação e custos. Afeta transporte e logística.",
      comoLer: "Se sobe com USD/BRL subindo, tende a pressionar combustíveis.",
    },
  },
  {
    id: "xau_usd",
    group: "overview",
    label: "Ouro Spot",
    precision: 2,
    badge: "Londres/Spot",
    help: {
      oQueE: "Preço do ouro internacional (spot, referência global).",
      porQueImporta: "Reserva de valor; costuma reagir a risco e juros reais.",
      comoLer: "Se ouro sobe com VIX subindo, é movimento defensivo.",
    },
  },

  {
    id: "xag_usd",
    group: "overview",
    label: "Prata (XAG/USD)",
    precision: 2,
    help: {
      oQueE: "Preço da prata em USD por onça.",
      porQueImporta: "Metal misto: reserva + industrial. Costuma ser mais volátil que o ouro.",
      comoLer: "Se prata cai junto com cobre/petróleo, pode sinalizar fraqueza industrial. Se sobe com ouro, pode ser stress.",
    },
  },
  {
    id: "btc_usd",
    group: "overview",
    label: "Bitcoin",
    precision: 0,
    badge: "Cripto",
    help: {
      oQueE: "Preço do Bitcoin em USD.",
      porQueImporta: "Termômetro de liquidez e risco. Volátil.",
      comoLer: "Se cai com Nasdaq, é risk-off. Se sobe com dólar caindo, é risco-on.",
    },
  },

  {
    id: "eth_usd",
    group: "overview",
    label: "Ethereum (USD)",
    precision: 0,
    help: {
      oQueE: "Preço do Ethereum em dólar.",
      porQueImporta: "É a rede base de várias aplicações cripto. Em geral, é mais volátil que o BTC.",
      comoLer: "Em bull markets, ETH pode subir mais que BTC. Em quedas, pode cair mais (risco maior).",
    },
  },

  {
    id: "brl_ipca_12m",
    group: "overview",
    label: "IPCA 12m",
    precision: 2,
    badge: "Brasil",
    help: {
      oQueE: "Inflação oficial (IPCA) acumulada em 12 meses.",
      porQueImporta: "Mostra perda de poder de compra e influencia diretamente juros e renda fixa.",
      comoLer: "Se está subindo, juros tendem a ficar mais altos por mais tempo. Se está caindo, abre espaço para cortes.",
    },
  },
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

  {
    id: "usd_jpy",
    group: "fx",
    label: "USD/JPY",
    precision: 3,
    help: {
      oQueE: "Quanto 1 dólar compra em ienes.",
      porQueImporta:
        "O iene costuma ser moeda de 'proteção' e de financiamento. Mudanças fortes afetam mercados globais.",
      comoLer:
        "USD/JPY subindo = iene ficando mais fraco. USD/JPY caindo = iene fortalecendo (às vezes por aversão ao risco).",
    },
  },
  {
    id: "usd_cny",
    group: "fx",
    label: "USD/CNY",
    precision: 4,
    help: {
      oQueE: "Quanto 1 dólar compra em yuan.",
      porQueImporta:
        "É um termômetro importante de política cambial chinesa. Mexe com exportações, commodities e inflação global.",
      comoLer:
        "USD/CNY subindo = yuan mais fraco. Se isso acontece com cobre/soja caindo, pode ser sinal de desaceleração.",
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

  // Bolsas
  {
    id: "sp500",
    group: "equities",
    label: "S&P 500",
    precision: 0,
    badge: "EUA",
    help: {
      oQueE: "Índice das 500 maiores empresas dos EUA.",
      porQueImporta:
        "É o principal termômetro de risco do mundo. Quando sobe, geralmente há apetite por risco. Quando cai, o mercado está mais defensivo.",
      comoLer:
        "Se S&P cai junto com VIX subindo, é 'risk-off'. Se S&P sobe e DXY cai, costuma ser cenário favorável para emergentes.",
      exemplos: [
        "S&P caindo + juros EUA subindo → pressão em tecnologia e crescimento.",
      ],
    },
  },
  {
    id: "sp500_change_pct",
    group: "equities",
    label: "S&P 500 (var. dia)",
    precision: 2,
    badge: "%",
    help: {
      oQueE: "Variação percentual do dia (aprox. de abertura→fechamento).",
      porQueImporta: "Ajuda a ver rapidamente se o mercado foi de alta ou queda no dia.",
      comoLer: "Positivo = alta, negativo = queda. Em dias muito voláteis, confira VIX.",
    },
  },
  {
    id: "nasdaq100",
    group: "equities",
    label: "Nasdaq 100",
    precision: 0,
    badge: "Tech",
    help: {
      oQueE: "Índice com as maiores empresas não-financeiras listadas na Nasdaq.",
      porQueImporta:
        "É muito sensível a juros: quando juros sobem, empresas de crescimento tendem a sofrer.",
      comoLer:
        "Se Nasdaq cai mais que S&P, geralmente é pressão em tecnologia por juros altos. Se sobe forte, apetite por risco e liquidez melhor.",
    },
  },
  {
    id: "nasdaq100_change_pct",
    group: "equities",
    label: "Nasdaq 100 (var. dia)",
    precision: 2,
    badge: "%",
    help: {
      oQueE: "Variação percentual do dia (aprox. de abertura→fechamento).",
      porQueImporta: "Nasdaq é sensível a juros e costuma oscilar mais.",
      comoLer: "Alta forte pode indicar risk-on; queda forte pode indicar stress ou juros subindo.",
    },
  },
  {
    id: "dowjones",
    group: "equities",
    label: "Dow Jones",
    precision: 0,
    badge: "EUA",
    help: {
      oQueE: "Índice tradicional com 30 blue chips americanas.",
      porQueImporta:
        "Serve como termômetro de empresas maduras e industriais. Às vezes cai menos em stress que Nasdaq.",
      comoLer:
        "Se Dow cai menos que Nasdaq em um dia ruim, mercado está preferindo 'qualidade' e empresas consolidadas.",
    },
  },
  {
    id: "dowjones_change_pct",
    group: "equities",
    label: "Dow Jones (var. dia)",
    precision: 2,
    badge: "%",
    help: {
      oQueE: "Variação percentual do dia (aprox. de abertura→fechamento).",
      porQueImporta: "Dow tende a refletir empresas maduras; às vezes cai menos em stress.",
      comoLer: "Se Dow cai menos que Nasdaq, o mercado está preferindo qualidade/defensivo.",
    },
  },
  {
    id: "ibov",
    group: "equities",
    label: "Ibovespa",
    precision: 0,
    badge: "Brasil",
    help: {
      oQueE: "Principal índice da bolsa brasileira.",
      porQueImporta:
        "Mostra a percepção sobre Brasil. Depende muito de commodities, dólar, juros e cenário político.",
      comoLer:
        "Se Ibov cai e USD/BRL sobe ao mesmo tempo, normalmente é pressão local (risco Brasil).",
      exemplos: ["Ibov subindo com dólar caindo → fluxo externo/otimismo."],
    },
  },
  {
    id: "ibov_change_pct",
    group: "equities",
    label: "Ibovespa (var. dia)",
    precision: 2,
    badge: "%",
    help: {
      oQueE: "Variação percentual do dia (aprox. de abertura→fechamento).",
      porQueImporta: "Leitura rápida do humor do mercado no Brasil.",
      comoLer: "Se Ibov cai e USD/BRL sobe, costuma ser pressão local (risco Brasil).",
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
    id: "xag_usd",
    group: "metals",
    label: "Prata (XAG/USD)",
    precision: 2,
    unit: "USD/oz",
    help: {
      oQueE: "Preço da prata em dólar por onça.",
      porQueImporta:
        "A prata mistura 'reserva' com 'indústria'. Ela costuma ser mais volátil que o ouro.",
      comoLer:
        "Se prata cai junto com cobre e petróleo, pode ser desaceleração industrial. Se sobe junto com ouro, pode ser stress/inflacionário.",
    },
  },

  {
    id: "copper_usd",
    group: "metals",
    label: "Cobre (futuro)",
    precision: 2,
    badge: "Indústria",
    help: {
      oQueE: "Preço do cobre (referência internacional).",
      porQueImporta:
        "Cobre é um termômetro de atividade industrial global (construção, eletrônica, energia).",
      comoLer:
        "Subindo por meses pode sugerir demanda forte. Caindo forte pode indicar desaceleração industrial.",
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
  {
    id: "natgas_usd_mmbtu",
    group: "energy",
    label: "Gás Natural",
    precision: 2,
    unit: "USD/MMBtu",
    help: {
      oQueE: "Preço do gás natural (EUA) por unidade térmica.",
      porQueImporta:
        "Gás natural impacta energia e custos industriais. Pode mexer com inflação e atividade.",
      comoLer:
        "Alta prolongada pressiona custo de energia. Quedas fortes podem indicar excesso de oferta ou demanda fraca.",
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

  // Agro
  {
    id: "soy_usd",
    group: "agri",
    label: "Soja (futuro)",
    precision: 2,
    badge: "Brasil",
    help: {
      oQueE: "Contrato futuro de soja (referência internacional).",
      porQueImporta:
        "Soja é chave para exportação brasileira e preços de alimentos (ração).",
      comoLer:
        "Soja sobe com demanda chinesa e clima adverso. Quedas podem indicar safra forte ou demanda menor.",
    },
  },
  {
    id: "corn_usd",
    group: "agri",
    label: "Milho (futuro)",
    precision: 2,
    help: {
      oQueE: "Contrato futuro de milho.",
      porQueImporta:
        "Milho afeta preços de carnes (ração) e energia (etanol).",
      comoLer:
        "Alta pode pressionar inflação de alimentos. Queda pode sinalizar safra forte.",
    },
  },
  {
    id: "wheat_usd",
    group: "agri",
    label: "Trigo (futuro)",
    precision: 2,
    help: {
      oQueE: "Contrato futuro de trigo.",
      porQueImporta:
        "Trigo impacta preços de alimentos básicos e inflação global.",
      comoLer:
        "Sobe com tensões geopolíticas e choque de oferta (clima/guerras).",
    },
  },
  {
    id: "coffee_usd",
    group: "agri",
    label: "Café (futuro)",
    precision: 2,
    badge: "Brasil",
    help: {
      oQueE: "Contrato futuro de café.",
      porQueImporta:
        "Brasil é grande produtor. Clima e logística mexem muito nesse preço.",
      comoLer:
        "Alta pode antecipar repasse no café interno com algum atraso.",
    },
  },
  {
    id: "sugar_usd",
    group: "agri",
    label: "Açúcar (futuro)",
    precision: 2,
    help: {
      oQueE: "Contrato futuro de açúcar.",
      porQueImporta:
        "Açúcar mexe com alimentos e com etanol (competição por cana).",
      comoLer:
        "Sobe com quebra de safra e demanda por bioenergia.",
    },
  },
  {
    id: "cotton_usd",
    group: "agri",
    label: "Algodão (futuro)",
    precision: 2,
    help: {
      oQueE: "Contrato futuro de algodão.",
      porQueImporta:
        "Impacta a cadeia têxtil. Pode sinalizar demanda de consumo global.",
      comoLer:
        "Alta pode indicar demanda por vestuário e indústria; queda pode indicar desaceleração.",
    },
  },

  // Cripto
  {
    id: "btc_usd",
    group: "crypto",
    label: "Bitcoin (USD)",
    precision: 0,
    badge: "BTC",
    help: {
      oQueE: "Preço do Bitcoin em dólar.",
      porQueImporta:
        "Serve como termômetro de apetite por risco e liquidez. Também é narrativa de 'reserva alternativa'.",
      comoLer:
        "BTC costuma subir com liquidez e risco-on. Em stress global, pode cair forte por desalavancagem.",
      exemplos: ["BTC caindo junto com Nasdaq = risk-off."],
    },
  },
  {
    id: "eth_usd",
    group: "crypto",
    label: "Ethereum (USD)",
    precision: 0,
    badge: "ETH",
    help: {
      oQueE: "Preço do Ethereum em dólar.",
      porQueImporta:
        "Ethereum concentra grande parte das aplicações (DeFi, NFTs, L2).",
      comoLer:
        "Em bull markets, ETH pode performar melhor que BTC. Em queda, costuma cair mais (maior risco).",
    },
  },
  {
    id: "sol_usd",
    group: "crypto",
    label: "Solana (USD)",
    precision: 0,
    badge: "SOL",
    help: {
      oQueE: "Preço da Solana em dólar.",
      porQueImporta:
        "É uma rede com foco em alta performance. Geralmente é ainda mais volátil.",
      comoLer:
        "Sobe muito em momentos de euforia e cai muito em risk-off. Use como termômetro de especulação.",
    },
  },
  {
    id: "btc_dominance",
    group: "crypto",
    label: "Dominância do BTC",
    precision: 2,
    unit: "%",
    badge: "Rotação",
    help: {
      oQueE: "Percentual do valor total do mercado cripto que está no Bitcoin.",
      porQueImporta:
        "Ajuda a entender rotação: quando dominância sobe, dinheiro busca 'segurança' no BTC; quando cai, vai para altcoins.",
      comoLer:
        "Dominância subindo = mercado mais defensivo. Dominância caindo = apetite por risco (altseason).",
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