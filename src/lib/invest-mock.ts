export type SignalDirection = "Long" | "Short";
export type CatalystType = "News" | "Technical" | "Both";

export type InvestSignal = {
  id: string;
  ticker: string;
  direction: SignalDirection;
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  catalyst: CatalystType;
  technicalSetup: string;
  rsi: number;
  macd: string;
  volumeSummary: string;
  newsHeadlines: { title: string; source: string; sentiment: "bullish" | "bearish" }[];
  bullCase: string[];
  bearCase: string[];
  dollarRisk: number;
  expectedReward: number;
};

export type WatchlistItem = {
  ticker: string;
  price: number;
  change1d: number;
  aiScore: number;
  sparkline: number[];
};

export type PortfolioPosition = {
  ticker: string;
  direction: SignalDirection;
  shares: number;
  entry: number;
  current: number;
  pnl: number;
  pnlPct: number;
};

export type TradeHistoryItem = {
  id: string;
  ticker: string;
  direction: SignalDirection;
  entry: number;
  exit: number;
  pnl: number;
  closedAt: string;
};

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
  tickers: string[];
  publishedAt: string;
};

export type SectorPerformance = {
  sector: string;
  change: number;
};

export type MarketPulse = {
  fearGreed: number;
  fearGreedLabel: string;
  vix: number;
  sectors: SectorPerformance[];
};

export const MOCK_SIGNALS: InvestSignal[] = [
  {
    id: "sig-1",
    ticker: "NVDA",
    direction: "Long",
    confidence: 87,
    entryPrice: 128.4,
    targetPrice: 142.0,
    stopPrice: 122.5,
    catalyst: "Both",
    technicalSetup: "Bull flag breakout above 20-day EMA with rising volume.",
    rsi: 58,
    macd: "Bullish crossover on daily",
    volumeSummary: "Volume 1.4x 20-day average",
    newsHeadlines: [
      { title: "NVIDIA data center demand remains strong into Q2", source: "Reuters", sentiment: "bullish" },
      { title: "Analysts raise PT on AI capex cycle", source: "Bloomberg", sentiment: "bullish" },
    ],
    bullCase: ["AI infrastructure spend accelerating", "Margin expansion in data center", "Technical breakout confirmed"],
    bearCase: ["Valuation stretched vs historical", "China export headwinds", "Semiconductor cycle risk"],
    dollarRisk: 590,
    expectedReward: 1360,
  },
  {
    id: "sig-2",
    ticker: "TSLA",
    direction: "Short",
    confidence: 72,
    entryPrice: 248.5,
    targetPrice: 228.0,
    stopPrice: 258.0,
    catalyst: "Technical",
    technicalSetup: "Failed retest of prior resistance; RSI divergence on 4H.",
    rsi: 68,
    macd: "Histogram fading near zero",
    volumeSummary: "Distribution volume on rallies",
    newsHeadlines: [
      { title: "EV price war intensifies in Europe", source: "CNBC", sentiment: "bearish" },
      { title: "Delivery estimates trimmed for March", source: "Electrek", sentiment: "bearish" },
    ],
    bullCase: ["FSD narrative could re-rate stock", "Energy storage growth"],
    bearCase: ["Margin compression", "Weak technical structure", "Competition from BYD"],
    dollarRisk: 950,
    expectedReward: 2050,
  },
  {
    id: "sig-3",
    ticker: "AAPL",
    direction: "Long",
    confidence: 64,
    entryPrice: 198.2,
    targetPrice: 208.5,
    stopPrice: 193.8,
    catalyst: "News",
    technicalSetup: "Consolidating in ascending triangle near highs.",
    rsi: 52,
    macd: "Neutral, coiling",
    volumeSummary: "Below average — watch breakout volume",
    newsHeadlines: [
      { title: "Services revenue hits record in latest filing", source: "WSJ", sentiment: "bullish" },
      { title: "EU regulatory fine risk persists", source: "FT", sentiment: "bearish" },
    ],
    bullCase: ["Services mix improving", "Buyback support", "Stable cash flows"],
    bearCase: ["iPhone cycle maturing", "China demand uncertainty"],
    dollarRisk: 440,
    expectedReward: 1030,
  },
  {
    id: "sig-4",
    ticker: "BTC-USD",
    direction: "Long",
    confidence: 81,
    entryPrice: 68420,
    targetPrice: 72000,
    stopPrice: 66200,
    catalyst: "Both",
    technicalSetup: "Higher low sequence; holding 50-day MA.",
    rsi: 55,
    macd: "Positive and widening",
    volumeSummary: "Spot volume rising on green days",
    newsHeadlines: [
      { title: "ETF inflows extend fifth consecutive week", source: "CoinDesk", sentiment: "bullish" },
      { title: "Macro headwinds from strong dollar", source: "MarketWatch", sentiment: "bearish" },
    ],
    bullCase: ["ETF demand structural", "Halving supply shock narrative", "Risk-on macro"],
    bearCase: ["Regulatory overhang", "Leverage flush risk"],
    dollarRisk: 2220,
    expectedReward: 3580,
  },
];

const BASE_WATCHLIST: WatchlistItem[] = [
  { ticker: "NVDA", price: 128.4, change1d: 2.1, aiScore: 82, sparkline: [120, 122, 121, 125, 127, 128, 128.4] },
  { ticker: "AAPL", price: 198.2, change1d: 0.4, aiScore: 61, sparkline: [195, 196, 197, 196, 198, 197, 198.2] },
  { ticker: "TSLA", price: 248.5, change1d: -1.8, aiScore: 44, sparkline: [255, 252, 250, 251, 249, 247, 248.5] },
  { ticker: "BTC-USD", price: 68420, change1d: 3.2, aiScore: 78, sparkline: [65000, 66000, 66500, 67000, 67800, 68000, 68420] },
  { ticker: "ETH-USD", price: 3420, change1d: 2.5, aiScore: 71, sparkline: [3200, 3250, 3300, 3350, 3380, 3400, 3420] },
];

export function getMockWatchlist(): WatchlistItem[] {
  const signalTickers = MOCK_SIGNALS.map((s) => s.ticker);
  const extra = signalTickers
    .filter((t) => !BASE_WATCHLIST.some((w) => w.ticker === t))
    .map((ticker) => {
      const sig = MOCK_SIGNALS.find((s) => s.ticker === ticker)!;
      return {
        ticker,
        price: sig.entryPrice,
        change1d: 0,
        aiScore: sig.confidence,
        sparkline: [sig.entryPrice * 0.97, sig.entryPrice * 0.98, sig.entryPrice * 0.99, sig.entryPrice],
      };
    });
  return [...BASE_WATCHLIST, ...extra];
}

export const MOCK_PORTFOLIO = {
  paperPnl: 4280.5,
  paperPnlPct: 4.28,
  openPositions: [
    { ticker: "NVDA", direction: "Long" as const, shares: 50, entry: 124.2, current: 128.4, pnl: 210, pnlPct: 3.38 },
    { ticker: "BTC-USD", direction: "Long" as const, shares: 0.5, entry: 65000, current: 68420, pnl: 1710, pnlPct: 5.26 },
  ] as PortfolioPosition[],
  history: [
    { id: "t-1", ticker: "META", direction: "Long" as const, entry: 480, exit: 512, pnl: 3200, closedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: "t-2", ticker: "AMD", direction: "Short" as const, entry: 165, exit: 158, pnl: 700, closedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  ] as TradeHistoryItem[],
};

export const MOCK_NEWS: NewsItem[] = [
  { id: "n-1", headline: "Fed officials signal patience on rate cuts", source: "Reuters", sentiment: "neutral", tickers: ["SPY"], publishedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "n-2", headline: "NVIDIA unveils next-gen inference platform", source: "Bloomberg", sentiment: "bullish", tickers: ["NVDA"], publishedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "n-3", headline: "Tesla margins under pressure in Europe", source: "CNBC", sentiment: "bearish", tickers: ["TSLA"], publishedAt: new Date(Date.now() - 10800000).toISOString() },
  { id: "n-4", headline: "Bitcoin ETF inflows hit weekly record", source: "CoinDesk", sentiment: "bullish", tickers: ["BTC-USD"], publishedAt: new Date(Date.now() - 14400000).toISOString() },
  { id: "n-5", headline: "Apple Services revenue beats estimates", source: "WSJ", sentiment: "bullish", tickers: ["AAPL"], publishedAt: new Date(Date.now() - 18000000).toISOString() },
];

export const MOCK_MARKET_PULSE: MarketPulse = {
  fearGreed: 62,
  fearGreedLabel: "Greed",
  vix: 14.8,
  sectors: [
    { sector: "Tech", change: 1.8 },
    { sector: "Energy", change: -0.6 },
    { sector: "Finance", change: 0.9 },
    { sector: "Health", change: 0.3 },
    { sector: "Consumer", change: -0.2 },
    { sector: "Industrial", change: 0.5 },
  ],
};
