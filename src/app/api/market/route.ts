import { NextResponse } from "next/server";
import type { MarketPayload } from "@/features/market/domain/types";

export const revalidate = 300; // 5 minutos (cache do Next)

// Cache em memória (funciona bem no dev e geralmente no serverless quente)
let CACHE: MarketPayload | null = null;
let CACHE_AT = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (active >= max) return;
    const fn = queue.shift();
    if (!fn) return;
    fn();
  }

  return function limit<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      };
      if (active < max) run();
      else queue.push(run);
    });
  };
}

function parseStooqCsvRow(csv: string): {
  symbol: string;
  date: string;
  close: number | null;
  open: number | null;
} | null {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const row = lines[1]!.split(",");
  if (row.length < 7) return null;
  const symbol = row[0] ?? "";
  const date = row[1] ?? "";
  const openRaw = row[3] ?? "";
  const closeRaw = row[6] ?? "";
  if (closeRaw === "N/D" || closeRaw === "N/A" || closeRaw === "") return null;
  const close = Number(closeRaw);
  const open = openRaw && openRaw !== "N/D" ? Number(openRaw) : null;
  return {
    symbol,
    date,
    close: Number.isFinite(close) ? close : null,
    open: open != null && Number.isFinite(open) ? open : null,
  };
}

// (reservado para futuras variações via Stooq)

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const res = await fetchWithTimeout(
    url,
    {
      headers: { "User-Agent": "Fin.SYS" },
      cache: "no-store",
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function safeFetchText(label: string, url: string, timeoutMs = 8000): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const text = await fetchText(url, timeoutMs);
    return { ok: true, text };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `${label}: ${msg}` };
  }
}

function parseFREDLastNumberFromCsv(csvText: string): number | null {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  // percorre ao contrário procurando última linha com valor
  for (let i = lines.length - 1; i >= 1; i--) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const v = parts[1]!.trim();
    if (!v || v === ".") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseBcbNumber(v: string | undefined): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function extractFirstNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const n = Number(match[1].replace(",", "."));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

async function fetchYahooChart(symbol: string) {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=5d`;
  return await safeFetch<{ chart: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number } }> } }>(
    `yahoo:${symbol}`,
    url,
  );
}

type YahooMeta = { regularMarketPrice?: number; chartPreviousClose?: number };

function changePctFromYahooMeta(meta: YahooMeta | undefined): number | undefined {
  if (meta?.regularMarketPrice == null || meta?.chartPreviousClose == null || meta.chartPreviousClose === 0) return undefined;
  return (meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose;
}

function ymdFromBcbDate(dmy: string | undefined): string | null {
  if (!dmy) return null;
  const [dd, mm, yyyy] = dmy.split("/");
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const res = await fetchWithTimeout(
    url,
    {
      headers: { "User-Agent": "Fin.SYS" },
      cache: "no-store",
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function safeFetch<T>(label: string, url: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const data = await fetchJson<T>(url);
    return { ok: true, data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `${label}: ${msg}` };
  }
}

// helpers reservados para futuros agregados

async function fetchSgeAu9999CnyG(): Promise<number | undefined> {
  const endpoints = [
    "https://www.sge.com.cn/sge_data/quoteData",
    "https://www.sge.com.cn/sge-data/quoteData",
    "https://www.sge.com.cn/sge_data/quotDaily",
  ];

  for (const url of endpoints) {
    const r = await safeFetchText("sge", url, 4000);
    if (!r.ok) continue;
    const raw = r.text;
    try {
      const json = JSON.parse(raw);
      const list = json?.data || json?.Data || json?.list || json?.List || [];
      const item = Array.isArray(list)
        ? list.find((x) => String(x?.product || x?.Product || x?.name || x?.Name || "").includes("Au99.99"))
        : null;
      const value = item?.close || item?.Close || item?.price || item?.Price || item?.last || item?.Last;
      const n = Number(String(value).replace(",", "."));
      if (Number.isFinite(n)) return n;
    } catch {
      const n = extractFirstNumber(raw, [
        /Au99\.99[^0-9]{0,20}([0-9]+\.?[0-9]*)/i,
        /Au99\.99[^0-9]{0,20}([0-9]+,[0-9]*)/i,
      ]);
      if (n != null) return n;
    }
  }
  return undefined;
}

async function fetchBrazilCdsBps(): Promise<number | undefined> {
  const r = await safeFetchText(
    "cds",
    "https://www.worldgovernmentbonds.com/cds-historical-data/brazil/5-years/",
    5000,
  );
  if (!r.ok) return undefined;
  const html = r.text;
  return extractFirstNumber(html, [
    /Last[^0-9]{0,20}([0-9]{2,4}\.?[0-9]{0,2})/i,
    /Latest[^0-9]{0,20}([0-9]{2,4}\.?[0-9]{0,2})/i,
    /CDS[^0-9]{0,20}([0-9]{2,4}\.?[0-9]{0,2})/i,
  ]);
}

export async function GET() {
  // Cache primeiro (evita rate-limit principalmente do CoinGecko)
  const now = Date.now();
  if (CACHE && now - CACHE_AT < CACHE_TTL_MS) {
    return NextResponse.json({ ...CACHE, meta: { ...(CACHE.meta ?? {}), stale: false } });
  }

  type CoinGeckoSimplePrice = {
    bitcoin?: { brl?: number; usd?: number };
    ethereum?: { brl?: number; usd?: number };
    solana?: { brl?: number; usd?: number };
    "tether-gold"?: { usd?: number; brl?: number };
    "pax-gold"?: { usd?: number; brl?: number };
  };
  type BcbSgsRow = { data: string; valor: string };

  type ErApi = { rates: Record<string, number>; time_last_update_unix?: number };

  // Limita concorrência para evitar "fetch failed" por excesso de conexões simultâneas
  // (principalmente em ambiente serverless)
  const limit = createLimiter(6);

  const [
    fxR,
    cryptoR,
    selicR,
    ipcaMomR,
    ipca12mR,
    t10y2yR,
    m2R,
    dxyR,
    xauR,
    xagR,
    globalR,
    us2yR,
    us10yR,
    fedFundsR,
    tips10yR,
    vixR,
    wtiR,
    natgasR,
    copperR,
    wheatR,
    cornR,
    soyR,
    sugarR,
    coffeeR,
    cottonR,
    platinumR,
    palladiumR,
    gasolineR,
    heatingOilR,
    aluminumR,
    nickelR,
    remxR,
    litR,
    uraR,
    usdbrlR,
    eurbrlR,
    cnybrlR,
    jpybrlR,
    usdjpyR,
    usdcnyR,
    sgeR,
    cdsR,
    ibovR,
  ] = await Promise.all([
    limit(() => safeFetch<ErApi>("fx", "https://open.er-api.com/v6/latest/USD")),
    limit(() => safeFetch<CoinGeckoSimplePrice>(
      "crypto",
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether-gold,pax-gold&vs_currencies=brl,usd",
    )),
    limit(() => safeFetch<BcbSgsRow[]>(
      "selic",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/10?formato=json",
    )),
    // IPCA (m/m): série 433 (histórica). Usamos endpoint completo e filtramos localmente.
    limit(() => safeFetch<BcbSgsRow[]>(
      "ipca_mom",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json",
    )),
    // IPCA 12m: série 13522 (já vem acumulado em 12 meses)
    limit(() => safeFetch<BcbSgsRow[]>(
      "ipca_12m",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/10?formato=json",
    )),
    limit(() => safeFetchText("t10y2y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y2Y")),
    limit(() => safeFetchText("m2", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=WM2NS")),
    limit(() => safeFetchText("dxy", "https://stooq.com/q/l/?s=dx.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("xau", "https://stooq.com/q/l/?s=xauusd&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("xag", "https://stooq.com/q/l/?s=xagusd&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetch<{ data: { market_cap_percentage: Record<string, number> } }>(
      "global",
      "https://api.coingecko.com/api/v3/global",
    )),

    // FRED (juros EUA)
    limit(() => safeFetchText("us2y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS2")),
    limit(() => safeFetchText("us10y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10")),
    limit(() => safeFetchText("fedfunds", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=EFFR")),
    limit(() => safeFetchText("tips10y", "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII10")),

    // VIX (Yahoo)
    limit(() => fetchYahooChart("^VIX")),

    // Commodities / futuros (Stooq)
    limit(() => safeFetchText("wti", "https://stooq.com/q/l/?s=cl.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("natgas", "https://stooq.com/q/l/?s=ng.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("copper", "https://stooq.com/q/l/?s=hg.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("wheat", "https://stooq.com/q/l/?s=zw.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("corn", "https://stooq.com/q/l/?s=zc.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("soy", "https://stooq.com/q/l/?s=zs.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("sugar", "https://stooq.com/q/l/?s=sb.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("coffee", "https://stooq.com/q/l/?s=kc.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("cotton", "https://stooq.com/q/l/?s=ct.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("platinum", "https://stooq.com/q/l/?s=pl.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("palladium", "https://stooq.com/q/l/?s=pa.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("gasoline", "https://stooq.com/q/l/?s=rb.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("heating_oil", "https://stooq.com/q/l/?s=ho.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("aluminum", "https://stooq.com/q/l/?s=al.f&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("nickel", "https://stooq.com/q/l/?s=ni.f&f=sd2t2ohlcv&h&e=csv")),

    // ETFs proxy (elementos críticos)
    limit(() => safeFetchText("remx", "https://stooq.com/q/l/?s=remx.us&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("lit", "https://stooq.com/q/l/?s=lit.us&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("ura", "https://stooq.com/q/l/?s=ura.us&f=sd2t2ohlcv&h&e=csv")),

    // FX via Stooq (para históricos/gráficos e redundância)
    limit(() => safeFetchText("usdbrl", "https://stooq.com/q/l/?s=usdbrl&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("eurbrl", "https://stooq.com/q/l/?s=eurbrl&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("cnybrl", "https://stooq.com/q/l/?s=cnybrl&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("jpybrl", "https://stooq.com/q/l/?s=jpybrl&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("usdjpy", "https://stooq.com/q/l/?s=usdjpy&f=sd2t2ohlcv&h&e=csv")),
    limit(() => safeFetchText("usdcny", "https://stooq.com/q/l/?s=usdcny&f=sd2t2ohlcv&h&e=csv")),
    limit(() => fetchSgeAu9999CnyG()),
    limit(() => fetchBrazilCdsBps()),
    limit(() => fetchYahooChart("^BVSP")),
  ]);

  // Bolsas globais (Yahoo)
  const [nikkeiR, ftseR, stoxxR, shanghaiR] = await Promise.all([
    limit(() => fetchYahooChart("^N225")),
    limit(() => fetchYahooChart("^FTSE")),
    limit(() => fetchYahooChart("^STOXX50E")),
    limit(() => fetchYahooChart("000001.SS")),
  ]);

  // IFIX + proxy BDI + ações/FIIs (Yahoo)
  const [
    ifixR,
    bdryR,
    aaplR,
    nvdaR,
    asmlR,
    meliR,
    pltrR,
    hdbR,
    vale3R,
    petr4R,
    alos3R,
    bbas3R,
    dirr3R,
    cmig4R,
    kncr11R,
    cpts11R,
    btlg11R,
    trxf11R,
    xpml11R,
  ] = await Promise.all([
    limit(() => fetchYahooChart("IFIX.SA")),
    limit(() => fetchYahooChart("BDRY")),

    limit(() => fetchYahooChart("AAPL")),
    limit(() => fetchYahooChart("NVDA")),
    limit(() => fetchYahooChart("ASML")),
    limit(() => fetchYahooChart("MELI")),
    limit(() => fetchYahooChart("PLTR")),
    limit(() => fetchYahooChart("HDB")),

    limit(() => fetchYahooChart("VALE3.SA")),
    limit(() => fetchYahooChart("PETR4.SA")),
    limit(() => fetchYahooChart("ALOS3.SA")),
    limit(() => fetchYahooChart("BBAS3.SA")),
    limit(() => fetchYahooChart("DIRR3.SA")),
    limit(() => fetchYahooChart("CMIG4.SA")),

    limit(() => fetchYahooChart("KNCR11.SA")),
    limit(() => fetchYahooChart("CPTS11.SA")),
    limit(() => fetchYahooChart("BTLG11.SA")),
    limit(() => fetchYahooChart("TRXF11.SA")),
    limit(() => fetchYahooChart("XPML11.SA")),
  ]);

  // Bolsas (Yahoo Chart) - usando mesma estratégia do VIX/IBOV
  const [spxR, ndxR, djiR] = await Promise.all([
    limit(() => fetchYahooChart("^GSPC")),
    limit(() => fetchYahooChart("^NDX")),
    limit(() => fetchYahooChart("^DJI")),
  ]);

  const warnings = [
    fxR.ok ? null : fxR.error,
    cryptoR.ok ? null : cryptoR.error,
    selicR.ok ? null : selicR.error,
    ipcaMomR.ok ? null : ipcaMomR.error,
    ipca12mR.ok ? null : ipca12mR.error,
    t10y2yR.ok ? null : t10y2yR.error,
    m2R.ok ? null : m2R.error,
    dxyR.ok ? null : dxyR.error,
    xauR.ok ? null : xauR.error,
    xagR.ok ? null : xagR.error,
    globalR.ok ? null : globalR.error,
    us2yR.ok ? null : us2yR.error,
    us10yR.ok ? null : us10yR.error,
    fedFundsR.ok ? null : fedFundsR.error,
    tips10yR.ok ? null : tips10yR.error,
    vixR.ok ? null : vixR.error,
    wtiR.ok ? null : wtiR.error,
    natgasR.ok ? null : natgasR.error,
    copperR.ok ? null : copperR.error,
    wheatR.ok ? null : wheatR.error,
    cornR.ok ? null : cornR.error,
    soyR.ok ? null : soyR.error,
    sugarR.ok ? null : sugarR.error,
    coffeeR.ok ? null : coffeeR.error,
    cottonR.ok ? null : cottonR.error,
    platinumR.ok ? null : platinumR.error,
    palladiumR.ok ? null : palladiumR.error,
    gasolineR.ok ? null : gasolineR.error,
    heatingOilR.ok ? null : heatingOilR.error,
    aluminumR.ok ? null : aluminumR.error,
    nickelR.ok ? null : nickelR.error,
    remxR.ok ? null : remxR.error,
    litR.ok ? null : litR.error,
    uraR.ok ? null : uraR.error,
    usdbrlR.ok ? null : usdbrlR.error,
    eurbrlR.ok ? null : eurbrlR.error,
    cnybrlR.ok ? null : cnybrlR.error,
    jpybrlR.ok ? null : jpybrlR.error,
    usdjpyR.ok ? null : usdjpyR.error,
    usdcnyR.ok ? null : usdcnyR.error,
    ibovR.ok ? null : ibovR.error,
    spxR.ok ? null : spxR.error,
    ndxR.ok ? null : ndxR.error,
    djiR.ok ? null : djiR.error,
    nikkeiR.ok ? null : nikkeiR.error,
    ftseR.ok ? null : ftseR.error,
    stoxxR.ok ? null : stoxxR.error,
    shanghaiR.ok ? null : shanghaiR.error,

    ifixR.ok ? null : ifixR.error,
    bdryR.ok ? null : bdryR.error,

    aaplR.ok ? null : aaplR.error,
    nvdaR.ok ? null : nvdaR.error,
    asmlR.ok ? null : asmlR.error,
    meliR.ok ? null : meliR.error,
    pltrR.ok ? null : pltrR.error,
    hdbR.ok ? null : hdbR.error,

    vale3R.ok ? null : vale3R.error,
    petr4R.ok ? null : petr4R.error,
    alos3R.ok ? null : alos3R.error,
    bbas3R.ok ? null : bbas3R.error,
    dirr3R.ok ? null : dirr3R.error,
    cmig4R.ok ? null : cmig4R.error,

    kncr11R.ok ? null : kncr11R.error,
    cpts11R.ok ? null : cpts11R.error,
    btlg11R.ok ? null : btlg11R.error,
    trxf11R.ok ? null : trxf11R.error,
    xpml11R.ok ? null : xpml11R.error,
  ].filter((x): x is string => Boolean(x));

  // se falhou algo e temos cache antigo, devolve cache para não quebrar UI
  if (warnings.length > 0 && CACHE) {
    // Mescla: mantém o que conseguimos atualizar agora, e completa com cache antigo.
    // Isso evita ficar "congelado" quando só UMA fonte falha.
    const payload: MarketPayload = {
      ...CACHE,
      fetchedAt: new Date().toISOString(),
      values: { ...CACHE.values },
      meta: {
        stale: true,
        note: "Alguns índices falharam; usando cache apenas para os que faltaram.",
        errors: warnings,
      },
    };
    // Continua o fluxo normal para tentar preencher valores novos abaixo,
    // mas já com base no cache (fallback por campo).
    CACHE = payload;
  }

  // sem cache (ou sem falhas): segue normal (se algo falhar e não tem cache, retorna valores parciais)
  const fx = fxR.ok ? fxR.data : { rates: {} };
  const crypto = cryptoR.ok ? cryptoR.data : {};
  const selic = selicR.ok ? selicR.data : [];
  const ipcaMomAll = ipcaMomR.ok ? ipcaMomR.data : [];
  // Mantém apenas janela recente para reduzir custo e evitar cálculos enormes.
  const ipcaMom = ipcaMomAll.slice(-36);

  const ipca12mAll = ipca12mR.ok ? ipca12mR.data : [];
  const ipca12mLast = ipca12mAll.at(-1);

  const stooqUsdBrl = usdbrlR.ok ? parseStooqCsvRow(usdbrlR.text) : null;
  const stooqEurBrl = eurbrlR.ok ? parseStooqCsvRow(eurbrlR.text) : null;
  const stooqCnyBrl = cnybrlR.ok ? parseStooqCsvRow(cnybrlR.text) : null;
  const stooqJpyBrl = jpybrlR.ok ? parseStooqCsvRow(jpybrlR.text) : null;
  const stooqUsdJpy = usdjpyR.ok ? parseStooqCsvRow(usdjpyR.text) : null;
  const stooqUsdCny = usdcnyR.ok ? parseStooqCsvRow(usdcnyR.text) : null;

  const usd_brl = stooqUsdBrl?.close ?? fx.rates?.BRL;
  const usd_eur = fx.rates?.EUR;
  const usd_cny = stooqUsdCny?.close ?? fx.rates?.CNY;
  const eur_brl = stooqEurBrl?.close ?? (usd_brl && usd_eur ? usd_brl / usd_eur : undefined);
  const cny_brl = stooqCnyBrl?.close ?? (usd_brl && usd_cny ? usd_brl / usd_cny : undefined);
  const jpy_brl = stooqJpyBrl?.close ?? undefined;
  const usd_jpy = stooqUsdJpy?.close ?? undefined;
  const usd_cny_fx = stooqUsdCny?.close ?? undefined;

  const btc_brl = crypto.bitcoin?.brl;
  const btc_usd = crypto.bitcoin?.usd;
  const eth_brl = crypto.ethereum?.brl;
  const eth_usd = crypto.ethereum?.usd;
  const sol_brl = crypto.solana?.brl;
  const sol_usd = crypto.solana?.usd;
  const btc_dominance = globalR.ok ? globalR.data.data.market_cap_percentage.btc : undefined;

  // ouro: preferir XAUUSD via Stooq; fallback via PAXG do CoinGecko
  const xau_usd = xauR.ok ? parseStooqCsvRow(xauR.text)?.close ?? undefined : undefined;
  const xag_usd = xagR.ok ? parseStooqCsvRow(xagR.text)?.close ?? undefined : undefined;
  const paxg_usd = crypto["pax-gold"]?.usd;
  const paxg_brl = crypto["pax-gold"]?.brl;
  const xauUsdFinal = xau_usd ?? paxg_usd;
  const gold_brl_oz = xauUsdFinal != null && usd_brl != null ? xauUsdFinal * usd_brl : paxg_brl;
  const gold_brl_g = gold_brl_oz != null ? gold_brl_oz / 31.1034768 : undefined;
  const gold_silver_ratio = xauUsdFinal != null && xag_usd != null && xag_usd !== 0 ? xauUsdFinal / xag_usd : undefined;
  const silver_brl_oz = xag_usd != null && usd_brl != null ? xag_usd * usd_brl : undefined;
  const silver_brl_g = silver_brl_oz != null ? silver_brl_oz / 31.1034768 : undefined;

  const lastSelic = selic?.[selic.length - 1];
  const brl_selic_aa = lastSelic?.valor != null
    ? Number(String(lastSelic.valor).replace(",", ".")) / 100
    : undefined;

  const lastIpca = ipcaMom?.[ipcaMom.length - 1];
  const brl_ipca_mom = lastIpca && lastIpca.valor != null
    ? (parseBcbNumber(lastIpca.valor) ?? 0) / 100
    : undefined;

  // IPCA 12m (preferência: série 13522). Fallback: compõe últimos 12 meses da série m/m.
  const brl_ipca_12m_direct = ipca12mLast?.valor != null ? (parseBcbNumber(ipca12mLast.valor) ?? 0) / 100 : undefined;
  const ipcaLast12 = ipcaMom.slice(-12).map((r) => (parseBcbNumber(r.valor) ?? 0) / 100);
  const brl_ipca_12m_fallback = ipcaLast12.length
    ? ipcaLast12.reduce((acc, x) => acc * (1 + x), 1) - 1
    : undefined;
  const brl_ipca_12m = brl_ipca_12m_direct ?? brl_ipca_12m_fallback;

  const brl_selic_real_simple =
    brl_selic_aa != null && brl_ipca_12m != null ? brl_selic_aa - brl_ipca_12m : undefined;
  const brl_selic_real_fisher =
    brl_selic_aa != null && brl_ipca_12m != null
      ? (1 + brl_selic_aa) / (1 + brl_ipca_12m) - 1
      : undefined;

  const t10y2y = t10y2yR.ok ? parseFREDLastNumberFromCsv(t10y2yR.text) ?? undefined : undefined;
  const m2_usd_bil = m2R.ok ? parseFREDLastNumberFromCsv(m2R.text) ?? undefined : undefined;
  const dxy = dxyR.ok ? parseStooqCsvRow(dxyR.text)?.close ?? undefined : undefined;

  const us2y = us2yR.ok ? parseFREDLastNumberFromCsv(us2yR.text) ?? undefined : undefined;
  const us10y = us10yR.ok ? parseFREDLastNumberFromCsv(us10yR.text) ?? undefined : undefined;
  const fed_funds = fedFundsR.ok ? parseFREDLastNumberFromCsv(fedFundsR.text) ?? undefined : undefined;
  const tips10y_real_yield = tips10yR.ok ? parseFREDLastNumberFromCsv(tips10yR.text) ?? undefined : undefined;
  const vix = vixR.ok ? vixR.data?.chart?.result?.[0]?.meta?.regularMarketPrice : undefined;

  const wti_usd_bbl = wtiR.ok ? parseStooqCsvRow(wtiR.text)?.close ?? undefined : undefined;
  const wti_brl_bbl = wti_usd_bbl != null && usd_brl != null ? wti_usd_bbl * usd_brl : undefined;
  const natgas_usd_mmbtu = natgasR.ok ? parseStooqCsvRow(natgasR.text)?.close ?? undefined : undefined;
  const copper_usd = copperR.ok ? parseStooqCsvRow(copperR.text)?.close ?? undefined : undefined;
  const wheat_usd = wheatR.ok ? parseStooqCsvRow(wheatR.text)?.close ?? undefined : undefined;
  const corn_usd = cornR.ok ? parseStooqCsvRow(cornR.text)?.close ?? undefined : undefined;
  const soy_usd = soyR.ok ? parseStooqCsvRow(soyR.text)?.close ?? undefined : undefined;
  const sugar_usd = sugarR.ok ? parseStooqCsvRow(sugarR.text)?.close ?? undefined : undefined;
  const coffee_usd = coffeeR.ok ? parseStooqCsvRow(coffeeR.text)?.close ?? undefined : undefined;
  const cotton_usd = cottonR.ok ? parseStooqCsvRow(cottonR.text)?.close ?? undefined : undefined;
  const platinum_usd_oz = platinumR.ok ? parseStooqCsvRow(platinumR.text)?.close ?? undefined : undefined;
  const palladium_usd_oz = palladiumR.ok ? parseStooqCsvRow(palladiumR.text)?.close ?? undefined : undefined;
  const gasoline_usd = gasolineR.ok ? parseStooqCsvRow(gasolineR.text)?.close ?? undefined : undefined;
  const heating_oil_usd = heatingOilR.ok ? parseStooqCsvRow(heatingOilR.text)?.close ?? undefined : undefined;
  const aluminum_usd = aluminumR.ok ? parseStooqCsvRow(aluminumR.text)?.close ?? undefined : undefined;
  const nickel_usd = nickelR.ok ? parseStooqCsvRow(nickelR.text)?.close ?? undefined : undefined;
  const etf_remx_usd = remxR.ok ? parseStooqCsvRow(remxR.text)?.close ?? undefined : undefined;
  const etf_lit_usd = litR.ok ? parseStooqCsvRow(litR.text)?.close ?? undefined : undefined;
  const etf_ura_usd = uraR.ok ? parseStooqCsvRow(uraR.text)?.close ?? undefined : undefined;

  const sge_cny_g = sgeR ?? undefined;

  const sge_usd_oz =
    sge_cny_g != null && usd_cny_fx != null
      ? (sge_cny_g / usd_cny_fx) * 31.1034768
      : undefined;
  const shanghai_premium_usd_oz =
    sge_usd_oz != null && xauUsdFinal != null ? sge_usd_oz - xauUsdFinal : undefined;

  const brazil_cds_5y_bps = cdsR ?? undefined;

  const ibovMeta: YahooMeta | undefined = ibovR.ok ? ibovR.data?.chart?.result?.[0]?.meta : undefined;
  const spxMeta: YahooMeta | undefined = spxR.ok ? spxR.data?.chart?.result?.[0]?.meta : undefined;
  const ndxMeta: YahooMeta | undefined = ndxR.ok ? ndxR.data?.chart?.result?.[0]?.meta : undefined;
  const djiMeta: YahooMeta | undefined = djiR.ok ? djiR.data?.chart?.result?.[0]?.meta : undefined;

  const nikkeiMeta: YahooMeta | undefined = nikkeiR.ok ? nikkeiR.data?.chart?.result?.[0]?.meta : undefined;
  const ftseMeta: YahooMeta | undefined = ftseR.ok ? ftseR.data?.chart?.result?.[0]?.meta : undefined;
  const stoxxMeta: YahooMeta | undefined = stoxxR.ok ? stoxxR.data?.chart?.result?.[0]?.meta : undefined;
  const shanghaiMeta: YahooMeta | undefined = shanghaiR.ok ? shanghaiR.data?.chart?.result?.[0]?.meta : undefined;

  const ifixMeta: YahooMeta | undefined = ifixR.ok ? ifixR.data?.chart?.result?.[0]?.meta : undefined;
  const bdryMeta: YahooMeta | undefined = bdryR.ok ? bdryR.data?.chart?.result?.[0]?.meta : undefined;

  const aaplMeta: YahooMeta | undefined = aaplR.ok ? aaplR.data?.chart?.result?.[0]?.meta : undefined;
  const nvdaMeta: YahooMeta | undefined = nvdaR.ok ? nvdaR.data?.chart?.result?.[0]?.meta : undefined;
  const asmlMeta: YahooMeta | undefined = asmlR.ok ? asmlR.data?.chart?.result?.[0]?.meta : undefined;
  const meliMeta: YahooMeta | undefined = meliR.ok ? meliR.data?.chart?.result?.[0]?.meta : undefined;
  const pltrMeta: YahooMeta | undefined = pltrR.ok ? pltrR.data?.chart?.result?.[0]?.meta : undefined;
  const hdbMeta: YahooMeta | undefined = hdbR.ok ? hdbR.data?.chart?.result?.[0]?.meta : undefined;

  const vale3Meta: YahooMeta | undefined = vale3R.ok ? vale3R.data?.chart?.result?.[0]?.meta : undefined;
  const petr4Meta: YahooMeta | undefined = petr4R.ok ? petr4R.data?.chart?.result?.[0]?.meta : undefined;
  const alos3Meta: YahooMeta | undefined = alos3R.ok ? alos3R.data?.chart?.result?.[0]?.meta : undefined;
  const bbas3Meta: YahooMeta | undefined = bbas3R.ok ? bbas3R.data?.chart?.result?.[0]?.meta : undefined;
  const dirr3Meta: YahooMeta | undefined = dirr3R.ok ? dirr3R.data?.chart?.result?.[0]?.meta : undefined;
  const cmig4Meta: YahooMeta | undefined = cmig4R.ok ? cmig4R.data?.chart?.result?.[0]?.meta : undefined;

  const kncr11Meta: YahooMeta | undefined = kncr11R.ok ? kncr11R.data?.chart?.result?.[0]?.meta : undefined;
  const cpts11Meta: YahooMeta | undefined = cpts11R.ok ? cpts11R.data?.chart?.result?.[0]?.meta : undefined;
  const btlg11Meta: YahooMeta | undefined = btlg11R.ok ? btlg11R.data?.chart?.result?.[0]?.meta : undefined;
  const trxf11Meta: YahooMeta | undefined = trxf11R.ok ? trxf11R.data?.chart?.result?.[0]?.meta : undefined;
  const xpml11Meta: YahooMeta | undefined = xpml11R.ok ? xpml11R.data?.chart?.result?.[0]?.meta : undefined;

  const ibov = ibovMeta?.regularMarketPrice;
  const sp500 = spxMeta?.regularMarketPrice;
  const nasdaq100 = ndxMeta?.regularMarketPrice;
  const dowjones = djiMeta?.regularMarketPrice;

  const nikkei225 = nikkeiMeta?.regularMarketPrice;
  const ftse100 = ftseMeta?.regularMarketPrice;
  const eurostoxx50 = stoxxMeta?.regularMarketPrice;
  const shanghai_comp = shanghaiMeta?.regularMarketPrice;

  // variação diária (%) para Bolsas
  // Usamos Yahoo meta.chartPreviousClose, que é a referência mais estável.
  const ibov_change_pct = changePctFromYahooMeta(ibovMeta);
  const sp500_change_pct = changePctFromYahooMeta(spxMeta);
  const nasdaq100_change_pct = changePctFromYahooMeta(ndxMeta);
  const dowjones_change_pct = changePctFromYahooMeta(djiMeta);

  const nikkei225_change_pct = changePctFromYahooMeta(nikkeiMeta);
  const ftse100_change_pct = changePctFromYahooMeta(ftseMeta);
  const eurostoxx50_change_pct = changePctFromYahooMeta(stoxxMeta);
  const shanghai_comp_change_pct = changePctFromYahooMeta(shanghaiMeta);

  const ifix_change_pct = changePctFromYahooMeta(ifixMeta);
  const bdry_change_pct = changePctFromYahooMeta(bdryMeta);

  const aapl_change_pct = changePctFromYahooMeta(aaplMeta);
  const nvda_change_pct = changePctFromYahooMeta(nvdaMeta);
  const asml_change_pct = changePctFromYahooMeta(asmlMeta);
  const meli_change_pct = changePctFromYahooMeta(meliMeta);
  const pltr_change_pct = changePctFromYahooMeta(pltrMeta);
  const hdb_change_pct = changePctFromYahooMeta(hdbMeta);

  const vale3_change_pct = changePctFromYahooMeta(vale3Meta);
  const petr4_change_pct = changePctFromYahooMeta(petr4Meta);
  const alos3_change_pct = changePctFromYahooMeta(alos3Meta);
  const bbas3_change_pct = changePctFromYahooMeta(bbas3Meta);
  const dirr3_change_pct = changePctFromYahooMeta(dirr3Meta);
  const cmig4_change_pct = changePctFromYahooMeta(cmig4Meta);

  const kncr11_change_pct = changePctFromYahooMeta(kncr11Meta);
  const cpts11_change_pct = changePctFromYahooMeta(cpts11Meta);
  const btlg11_change_pct = changePctFromYahooMeta(btlg11Meta);
  const trxf11_change_pct = changePctFromYahooMeta(trxf11Meta);
  const xpml11_change_pct = changePctFromYahooMeta(xpml11Meta);

  const payload: MarketPayload = {
    fetchedAt: new Date().toISOString(),
    values: {
      usd_brl,
      eur_brl,
      cny_brl,
      jpy_brl,
      usd_jpy,
      usd_cny: usd_cny_fx,
      btc_brl,
      btc_usd,
      btc_dominance,

      eth_brl,
      eth_usd,
      sol_brl,
      sol_usd,

      xau_usd: xauUsdFinal,
      xag_usd,
      gold_silver_ratio,
      gold_brl_oz,
      gold_brl_g,
      silver_brl_oz,
      silver_brl_g,

      dxy,
      t10y2y,
      m2_usd_bil,

      us2y,
      us10y,
      fed_funds,
      tips10y_real_yield,
      vix,

      sp500,
      nasdaq100,
      dowjones,
      ibov,

      nikkei225,
      ftse100,
      eurostoxx50,
      shanghai_comp,

      ifix: ifixMeta?.regularMarketPrice,
      bdry_usd: bdryMeta?.regularMarketPrice,

      aapl_usd: aaplMeta?.regularMarketPrice,
      nvda_usd: nvdaMeta?.regularMarketPrice,
      asml_usd: asmlMeta?.regularMarketPrice,
      meli_usd: meliMeta?.regularMarketPrice,
      pltr_usd: pltrMeta?.regularMarketPrice,
      hdb_usd: hdbMeta?.regularMarketPrice,

      vale3_brl: vale3Meta?.regularMarketPrice,
      petr4_brl: petr4Meta?.regularMarketPrice,
      alos3_brl: alos3Meta?.regularMarketPrice,
      bbas3_brl: bbas3Meta?.regularMarketPrice,
      dirr3_brl: dirr3Meta?.regularMarketPrice,
      cmig4_brl: cmig4Meta?.regularMarketPrice,

      kncr11_brl: kncr11Meta?.regularMarketPrice,
      cpts11_brl: cpts11Meta?.regularMarketPrice,
      btlg11_brl: btlg11Meta?.regularMarketPrice,
      trxf11_brl: trxf11Meta?.regularMarketPrice,
      xpml11_brl: xpml11Meta?.regularMarketPrice,

      sp500_change_pct,
      nasdaq100_change_pct,
      dowjones_change_pct,
      ibov_change_pct,

      nikkei225_change_pct,
      ftse100_change_pct,
      eurostoxx50_change_pct,
      shanghai_comp_change_pct,

      ifix_change_pct,
      bdry_change_pct,

      aapl_change_pct,
      nvda_change_pct,
      asml_change_pct,
      meli_change_pct,
      pltr_change_pct,
      hdb_change_pct,

      vale3_change_pct,
      petr4_change_pct,
      alos3_change_pct,
      bbas3_change_pct,
      dirr3_change_pct,
      cmig4_change_pct,

      kncr11_change_pct,
      cpts11_change_pct,
      btlg11_change_pct,
      trxf11_change_pct,
      xpml11_change_pct,

      brl_selic_aa,
      brl_ipca_mom,
      brl_ipca_12m,
      brl_selic_real_simple,
      brl_selic_real_fisher,

      wti_usd_bbl,
      wti_brl_bbl,
      natgas_usd_mmbtu,
      copper_usd,
      wheat_usd,
      corn_usd,
      soy_usd,
      sugar_usd,
      coffee_usd,
      cotton_usd,
      platinum_usd_oz,
      palladium_usd_oz,
      gasoline_usd,
      heating_oil_usd,
      aluminum_usd,
      nickel_usd,
      etf_ura_usd,
      etf_lit_usd,
      etf_remx_usd,

      sge_cny_g,
      sge_usd_oz,
      shanghai_premium_usd_oz,
      brazil_cds_5y_bps,
    },
    manual: {
      updatedAt: new Date().toISOString(),
      sge_cny_g,
      brazil_cds_5y_bps,
      ibov_index: ibov,
    },
    source: {
      fx: "open.er-api.com",
      crypto: "coingecko",
      selic: "bcb-sgs-432",
      fred: "fredgraph.csv",
      stooq: "stooq csv",
    },
    meta: warnings.length ? { stale: true, note: "Alguns índices estão temporariamente indisponíveis.", errors: warnings } : { stale: false },
  };

  // Se houve warnings e tínhamos cache, completamos campos undefined com o cache antigo.
  if (warnings.length > 0 && CACHE) {
    const mergedValues = { ...payload.values };
    for (const [k, v] of Object.entries(CACHE.values)) {
      const key = k as keyof typeof mergedValues;
      if (mergedValues[key] == null) mergedValues[key] = v as any;
    }
    payload.values = mergedValues;
  }

  CACHE = payload;
  CACHE_AT = now;

  return NextResponse.json(payload);
}
