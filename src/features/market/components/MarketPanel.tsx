"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { MarketPayload } from "@/features/market/domain/types";
import MarketCatalogSheet from "@/features/market/components/MarketCatalogSheet";

function formatNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export default function MarketPanel() {
  const [data, setData] = useState<MarketPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // carrega cache local instantaneamente para não ficar "vazio" enquanto a API busca dados
  useEffect(() => {
    try {
      const raw = localStorage.getItem("finSys.market.cache");
      if (raw) {
        const json = JSON.parse(raw) as MarketPayload;
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  async function load() {
    try {
      // não limpa UI inteira; só mostra loading no botão
      setLoading(true);
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Falha ao carregar índices (HTTP ${res.status}). ${txt.slice(0, 140)}`);
      }
      const json = (await res.json()) as MarketPayload;
      setData(json);

      try {
        localStorage.setItem("finSys.market.cache", JSON.stringify(json));
      } catch {
        // ignore
      }

      // Evita flood de mensagens. Mostra apenas aviso curto e não em vermelho (a UI trata)
      setError(json.meta?.stale ? (json.meta?.note ?? "Dados em cache") : null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar índices";
      // se já temos algo carregado, não exibe erro agressivo.
      if (!data) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => {
    const v = data?.values;
    const goldOz = v?.gold_brl_oz;
    const goldG = v?.gold_brl_g ?? (goldOz != null ? goldOz / 31.1034768 : null); // 1 onça troy = 31.1034768g
    return [
      {
        label: "USD/BRL",
        value: v?.usd_brl != null ? `R$ ${formatNumber(v.usd_brl, 3)}` : "—",
      },
      {
        label: "EUR/BRL",
        value: v?.eur_brl != null ? `R$ ${formatNumber(v.eur_brl, 3)}` : "—",
      },
      {
        label: "CNY/BRL",
        value: v?.cny_brl != null ? `R$ ${formatNumber(v.cny_brl, 3)}` : "—",
      },
      {
        label: "BTC/BRL",
        value: v?.btc_brl != null ? `R$ ${formatNumber(v.btc_brl, 0)}` : "—",
      },
      {
        label: "BTC/USD",
        value: v?.btc_usd != null ? `US$ ${formatNumber(v.btc_usd, 0)}` : "—",
      },
      {
        label: "SELIC",
        value: v?.brl_selic_aa != null ? `${formatNumber(v.brl_selic_aa * 100, 2)}% a.a.` : "—",
      },
      {
        label: "Ouro (BRL)",
        value:
          goldOz != null
            ? `R$ ${formatNumber(goldOz, 2)} / oz (R$ ${formatNumber(goldG ?? 0, 2)} / g)`
            : "—",
      },
    ];
  }, [data]);

  const groups = useMemo(() => {
    const v = data?.values;
    if (!v) return [] as Array<{ id: string; title: string; items: Array<{ id: string; label: string; value: string; help: string }> }>;

    const formatPct = (n?: number) => (n != null ? `${formatNumber(n * 100, 2)}%` : "—");

    const goldOz = v.gold_brl_oz;
    const goldG = v.gold_brl_g ?? (goldOz != null ? goldOz / 31.1034768 : null);
    const silverOz = v.silver_brl_oz;
    const silverG = v.silver_brl_g ?? (silverOz != null ? silverOz / 31.1034768 : null);

    return [
      {
        id: "ouro",
        title: "Ouro e Prata",
        items: [
          {
            id: "xau_usd",
            label: "Ouro Spot (XAU/USD)",
            value: v.xau_usd != null ? `US$ ${formatNumber(v.xau_usd, 2)}` : "—",
            help:
              "Preço do ouro em USD por onça troy. Se sobe com dólar caindo: proteção. Se ambos caem: liquidez apertada.",
          },
          {
            id: "xag_usd",
            label: "Prata Spot (XAG/USD)",
            value: v.xag_usd != null ? `US$ ${formatNumber(v.xag_usd, 2)}` : "—",
            help:
              "Preço da prata em USD por onça. É mais sensível ao ciclo industrial. Quedas fortes podem antecipar desaceleração.",
          },
          {
            id: "gold_brl",
            label: "Ouro (BRL)",
            value:
              goldOz != null ? `R$ ${formatNumber(goldOz, 2)} / oz (R$ ${formatNumber(goldG ?? 0, 2)} / g)` : "—",
            help: "Conversão do ouro para BRL. Útil para comparar com proteção local e inflação brasileira.",
          },
          {
            id: "silver_brl",
            label: "Prata (BRL)",
            value:
              silverOz != null ? `R$ ${formatNumber(silverOz, 2)} / oz (R$ ${formatNumber(silverG ?? 0, 2)} / g)` : "—",
            help: "Conversão da prata para BRL. Ajuda a comparar ciclo industrial com o câmbio local.",
          },
          {
            id: "gold_silver_ratio",
            label: "Gold/Silver Ratio",
            value: v.gold_silver_ratio != null ? formatNumber(v.gold_silver_ratio, 2) : "—",
            help:
              "Acima de 80: prata barata, sinal de recessão. Abaixo de 50: ouro perde força como reserva.",
          },
        ],
      },
      {
        id: "global",
        title: "Moeda Global e EUA",
        items: [
          {
            id: "dxy",
            label: "DXY",
            value: v.dxy != null ? formatNumber(v.dxy, 2) : "—",
            help: "Abaixo de 100: perda de hegemonia do dólar. Acima de 110: crise de liquidez global.",
          },
          {
            id: "t10y2y",
            label: "T10Y2Y (Spread)",
            value: v.t10y2y != null ? `${formatNumber(v.t10y2y, 2)} p.p.` : "—",
            help: "Se negativo: curva invertida, sinal forte de recessão (6–12 meses).",
          },
          {
            id: "m2",
            label: "M2 (US$ bi)",
            value: v.m2_usd_bil != null ? formatNumber(v.m2_usd_bil, 1) : "—",
            help: "Crescimento sem PIB: inflação futura. Quedas rápidas: risco de contração de liquidez.",
          },
          {
            id: "us2y",
            label: "US 2Y",
            value: v.us2y != null ? formatPct(v.us2y / 100) : "—",
            help: "Reflete expectativa de juros no curto prazo. Sobe quando mercado espera alta do Fed.",
          },
          {
            id: "us10y",
            label: "US 10Y",
            value: v.us10y != null ? formatPct(v.us10y / 100) : "—",
            help: "Ritmo de inflação de longo prazo. Sobe quando juros futuros e risco aumentam.",
          },
          {
            id: "fed_funds",
            label: "Fed Funds",
            value: v.fed_funds != null ? formatPct(v.fed_funds / 100) : "—",
            help: "Taxa básica dos EUA. Quanto maior, mais caro o crédito global.",
          },
          {
            id: "tips",
            label: "Real Yield (TIPS 10Y)",
            value: v.tips10y_real_yield != null ? `${formatNumber(v.tips10y_real_yield, 2)}%` : "—",
            help: "Juro real esperado. Se sobe demais, costuma pressionar ouro e ações.",
          },
          {
            id: "vix",
            label: "VIX",
            value: v.vix != null ? formatNumber(v.vix, 2) : "—",
            help: "Medidor de medo. Acima de 30 = estresse elevado; acima de 40 = pânico.",
          },
        ],
      },
      {
        id: "brasil",
        title: "Brasil",
        items: [
          {
            id: "usdbrl",
            label: "USD/BRL",
            value: v.usd_brl != null ? `R$ ${formatNumber(v.usd_brl, 3)}` : "—",
            help: "Se supera patamar crítico (ex.: 5,80) sinaliza fuga de capital e risco fiscal.",
          },
          {
            id: "cds",
            label: "Brazil CDS 5Y",
            value: v.brazil_cds_5y_bps != null ? `${formatNumber(v.brazil_cds_5y_bps, 0)} bps` : "—",
            help: "<200 ok; 200–250 atenção; >250 risco de estresse institucional.",
          },
          {
            id: "selic",
            label: "Selic (a.a.)",
            value: v.brl_selic_aa != null ? formatPct(v.brl_selic_aa) : "—",
            help: "Taxa básica brasileira. Subidas fortes indicam aperto para defender o Real.",
          },
          {
            id: "ipca12",
            label: "IPCA 12m",
            value: v.brl_ipca_12m != null ? formatPct(v.brl_ipca_12m) : "—",
            help: "Inflação acumulada. Quanto maior, mais corrosão do poder de compra.",
          },
          {
            id: "ipcam",
            label: "IPCA mês",
            value: v.brl_ipca_mom != null ? formatPct(v.brl_ipca_mom) : "—",
            help: "Inflação mensal. Se acelera por vários meses, tende a puxar juros.",
          },
          {
            id: "selic_real",
            label: "Selic Real",
            value: v.brl_selic_real_simple != null ? formatPct(v.brl_selic_real_simple) : "—",
            help: "Selic − IPCA 12m. Acima de 6% costuma travar a economia para conter câmbio/inflação.",
          },
        ],
      },
      {
        id: "digital",
        title: "Digital",
        items: [
          {
            id: "btc_usd",
            label: "BTC/USD",
            value: v.btc_usd != null ? `US$ ${formatNumber(v.btc_usd, 0)}` : "—",
            help: "Se sobe junto do ouro, é fuga do sistema fiduciário. Se cai com ouro, liquidez secando.",
          },
          {
            id: "btc_brl",
            label: "BTC/BRL",
            value: v.btc_brl != null ? `R$ ${formatNumber(v.btc_brl, 0)}` : "—",
            help: "Mesmo indicador, refletindo efeito cambial local.",
          },
          {
            id: "btc_dom",
            label: "BTC Dominance",
            value: v.btc_dominance != null ? `${formatNumber(v.btc_dominance, 2)}%` : "—",
            help: "Quando sobe, capital busca segurança do BTC; quando cai, apetite por risco em altcoins.",
          },
        ],
      },
      {
        id: "commodities",
        title: "Commodities & Elementos Críticos",
        items: [
          {
            id: "wti",
            label: "Petróleo (WTI)",
            value: v.wti_usd_bbl != null ? `US$ ${formatNumber(v.wti_usd_bbl, 2)} / bbl` : "—",
            help: "Alta do petróleo pressiona inflação global e custos logísticos.",
          },
          {
            id: "wti_brl",
            label: "Petróleo (BRL)",
            value: v.wti_brl_bbl != null ? `R$ ${formatNumber(v.wti_brl_bbl, 2)} / bbl` : "—",
            help: "Preço do barril convertido para BRL, útil para comparar impacto local.",
          },
          {
            id: "natgas",
            label: "Gás Natural",
            value: v.natgas_usd_mmbtu != null ? `US$ ${formatNumber(v.natgas_usd_mmbtu, 2)} / MMBtu` : "—",
            help: "Combustível base industrial. Alta prolongada pressiona energia e inflação.",
          },
          {
            id: "copper",
            label: "Cobre",
            value: v.copper_usd != null ? `US$ ${formatNumber(v.copper_usd, 2)}` : "—",
            help: "Metal do ciclo econômico. Alta = expansão; queda = desaceleração.",
          },
          {
            id: "aluminum",
            label: "Alumínio",
            value: v.aluminum_usd != null ? `US$ ${formatNumber(v.aluminum_usd, 2)}` : "—",
            help: "Usado em transporte e construção. Alta indica demanda industrial.",
          },
          {
            id: "nickel",
            label: "Níquel",
            value: v.nickel_usd != null ? `US$ ${formatNumber(v.nickel_usd, 2)}` : "—",
            help: "Essencial para baterias. Alta pode indicar ciclo forte de elétricos.",
          },
          {
            id: "platinum",
            label: "Platina",
            value: v.platinum_usd_oz != null ? `US$ ${formatNumber(v.platinum_usd_oz, 2)} / oz` : "—",
            help: "Metal raro. Movimentos bruscos podem sinalizar risco geopolítico.",
          },
          {
            id: "palladium",
            label: "Paládio",
            value: v.palladium_usd_oz != null ? `US$ ${formatNumber(v.palladium_usd_oz, 2)} / oz` : "—",
            help: "Usado em catalisadores e indústria automotiva.",
          },
          {
            id: "wheat",
            label: "Trigo",
            value: v.wheat_usd != null ? `US$ ${formatNumber(v.wheat_usd, 2)}` : "—",
            help: "Impacta preços de alimentos e inflação global.",
          },
          {
            id: "corn",
            label: "Milho",
            value: v.corn_usd != null ? `US$ ${formatNumber(v.corn_usd, 2)}` : "—",
            help: "Base para ração e biocombustível.",
          },
          {
            id: "soy",
            label: "Soja",
            value: v.soy_usd != null ? `US$ ${formatNumber(v.soy_usd, 2)}` : "—",
            help: "Exportação-chave do Brasil. Sobe com demanda da China.",
          },
          {
            id: "sugar",
            label: "Açúcar",
            value: v.sugar_usd != null ? `US$ ${formatNumber(v.sugar_usd, 2)}` : "—",
            help: "Afeta custos de alimentos e etanol.",
          },
          {
            id: "coffee",
            label: "Café",
            value: v.coffee_usd != null ? `US$ ${formatNumber(v.coffee_usd, 2)}` : "—",
            help: "Commodity importante para o Brasil. Altas pressionam mercado interno.",
          },
          {
            id: "cotton",
            label: "Algodão",
            value: v.cotton_usd != null ? `US$ ${formatNumber(v.cotton_usd, 2)}` : "—",
            help: "Impacta cadeia têxtil.",
          },
          {
            id: "gasoline",
            label: "Gasolina (futuro)",
            value: v.gasoline_usd != null ? `US$ ${formatNumber(v.gasoline_usd, 2)}` : "—",
            help: "Pressiona custo de transporte.",
          },
          {
            id: "heating_oil",
            label: "Diesel / Heating Oil",
            value: v.heating_oil_usd != null ? `US$ ${formatNumber(v.heating_oil_usd, 2)}` : "—",
            help: "Importante para logística e energia.",
          },
          {
            id: "etf_ura",
            label: "Urânio (ETF URA)",
            value: v.etf_ura_usd != null ? `US$ ${formatNumber(v.etf_ura_usd, 2)}` : "—",
            help: "Proxy do urânio. Alta indica demanda energética nuclear.",
          },
          {
            id: "etf_lit",
            label: "Lítio (ETF LIT)",
            value: v.etf_lit_usd != null ? `US$ ${formatNumber(v.etf_lit_usd, 2)}` : "—",
            help: "Proxy do lítio. Indica ciclo de baterias/elétricos.",
          },
          {
            id: "etf_remx",
            label: "Terras Raras (ETF REMX)",
            value: v.etf_remx_usd != null ? `US$ ${formatNumber(v.etf_remx_usd, 2)}` : "—",
            help: "Proxy de terras raras — insumos críticos para tecnologia e defesa.",
          },
        ],
      },
    ];
  }, [data]);

  const stress = useMemo(() => {
    const v = data?.values;
    if (!v) return { level: "—", note: "Dados insuficientes." } as const;
    let score = 0;
    if (v.dxy != null && v.dxy < 100) score += 1;
    if (v.t10y2y != null && v.t10y2y < 0) score += 2;
    if (v.gold_silver_ratio != null && v.gold_silver_ratio > 80) score += 1;
    if (v.vix != null && v.vix > 30) score += 2;
    if (v.brazil_cds_5y_bps != null && v.brazil_cds_5y_bps > 250) score += 2;

    if (score >= 5) return { level: "Alto", note: "Estresse elevado — aversão ao risco e pressão por liquidez." } as const;
    if (score >= 3) return { level: "Médio", note: "Sinais mistos — monitorar juros e câmbio." } as const;
    return { level: "Baixo", note: "Condições relativamente estáveis, sem alarmes fortes." } as const;
  }, [data]);

  const showSkeleton = hydrated && !data;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">Índices (Top 6)</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Atualiza automaticamente (10 min). {data?.fetchedAt ? `Último: ${data.fetchedAt}` : ""}
          </div>
        </div>
        <div className="w-32">
          <Button size="md" variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? "..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--muted)]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {showSkeleton
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="mt-2 h-4 w-24 rounded bg-white/10" />
            </div>
          ))
          : items.map((it) => (
            <div key={it.label} className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="text-xs text-[var(--muted)]">{it.label}</div>
              <div className="mt-1 text-sm font-bold">{it.value}</div>
            </div>
          ))}
      </div>

      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ver todos os índices
      </Button>

      {/* Novo modal (bem mais organizado) */}
      <MarketCatalogSheet open={open} onClose={() => setOpen(false)} data={data} />
    </Card>
  );
}
