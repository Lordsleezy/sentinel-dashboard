"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Sparkline from "@/components/invest/Sparkline";
import TradeBriefingModal from "@/components/invest/TradeBriefingModal";
import type {
  InvestSignal,
  MarketPulse,
  NewsItem,
  PortfolioPosition,
  TradeHistoryItem,
  WatchlistItem,
} from "@/lib/invest-mock";

type LiveSignal = Record<string, unknown>;
type LiveWatchlistItem = Record<string, unknown>;
type LivePortfolio = Record<string, unknown>;
type LiveNewsItem = Record<string, unknown>;
type LivePulse = Record<string, unknown>;

function confidenceColor(c: number) {
  if (c > 75) return "text-green-400";
  if (c >= 50) return "text-yellow-400";
  return "text-red-400";
}

function badge(cls: string, label: string) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function arr<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeSignal(row: LiveSignal, index: number): InvestSignal {
  const directionRaw = text(row.direction, "long").toLowerCase();
  const direction: "Long" | "Short" = directionRaw === "short" ? "Short" : "Long";
  const entryPrice = num(row.entryPrice ?? row.entry_price);
  const targetPrice = num(row.targetPrice ?? row.target_price);
  const stopPrice = num(row.stopPrice ?? row.stop_price);
  const newsHeadlines = arr<LiveNewsItem>(row.newsHeadlines ?? row.news_headlines).map((n) => ({
    title: text(n.title ?? n.headline, "Market update"),
    source: text(n.source, "Sentinel"),
    sentiment: text(n.sentiment, "neutral") === "negative" ? "bearish" as const : "bullish" as const,
  }));

  return {
    id: text(row.id, `${text(row.ticker, "SIG")}-${index}`),
    ticker: text(row.ticker, "N/A"),
    direction,
    confidence: num(row.confidence),
    entryPrice,
    targetPrice,
    stopPrice,
    catalyst: text(row.catalyst, "Technical") as InvestSignal["catalyst"],
    technicalSetup: text(row.technicalSetup ?? row.technical_summary, "Live technical scan"),
    rsi: num(row.rsi),
    macd: text(row.macd ?? row.macd_signal, "n/a"),
    volumeSummary: row.volumeSummary ? text(row.volumeSummary) : `Volume ratio ${num(row.volume_ratio, 0).toFixed(2)}`,
    newsHeadlines,
    bullCase: arr<string>(row.bullCase ?? row.bull_case),
    bearCase: arr<string>(row.bearCase ?? row.bear_case),
    dollarRisk: num(row.dollarRisk ?? row.risk_dollars),
    expectedReward: num(row.expectedReward ?? row.reward_dollars),
  };
}

function normalizeWatchlist(row: LiveWatchlistItem): WatchlistItem {
  const history = arr<LiveWatchlistItem>(row.history);
  const sparkline = history.map((h) => num(h.price)).filter((v) => v > 0);
  const price = num(row.price);
  return {
    ticker: text(row.ticker, "N/A"),
    price,
    change1d: num(row.change1d ?? row.change_1d),
    aiScore: num(row.aiScore ?? row.ai_score),
    sparkline: sparkline.length > 1 ? sparkline : [price * 0.99, price],
  };
}

function normalizePortfolio(data: LivePortfolio) {
  const balance = num(data.balance);
  const positions = arr<LivePortfolio>(data.openPositions ?? data.positions).map((p) => {
    const entry = num(p.entry ?? p.avg_entry_price);
    const current = num(p.current ?? p.current_price);
    const pnl = num(p.pnl ?? p.unrealized_pl);
    return {
      ticker: text(p.ticker ?? p.symbol, "N/A"),
      direction: text(p.direction ?? p.side, "Long") === "Short" ? "Short" as const : "Long" as const,
      shares: num(p.shares ?? p.qty),
      entry,
      current,
      pnl,
      pnlPct: num(p.pnlPct ?? p.unrealized_plpc) * (Math.abs(num(p.unrealized_plpc)) < 1 ? 100 : 1),
    };
  });
  const history = arr<LivePortfolio>(data.history ?? data.trade_history).map((t, index) => ({
    id: text(t.id, `trade-${index}`),
    ticker: text(t.ticker ?? t.symbol, "N/A"),
    direction: text(t.direction ?? t.side, "Long") === "Short" ? "Short" as const : "Long" as const,
    entry: num(t.entry ?? t.limit_price ?? t.filled_avg_price),
    exit: num(t.exit ?? t.stop_price),
    pnl: num(t.pnl),
    closedAt: text(t.closedAt ?? t.created_at, new Date().toISOString()),
  }));
  return {
    paperPnl: num(data.paperPnl ?? data.pnl),
    paperPnlPct: balance ? (num(data.paperPnl ?? data.pnl) / balance) * 100 : num(data.paperPnlPct),
    openPositions: positions,
    history,
  };
}

function normalizeNews(data: unknown): NewsItem[] {
  return arr<LiveNewsItem>((data as { items?: unknown })?.items ?? data).map((n, index) => ({
    id: text(n.id, `news-${index}`),
    headline: text(n.headline ?? n.title, "Market headline"),
    source: text(n.source, "Sentinel"),
    sentiment: text(n.sentiment, "neutral") as NewsItem["sentiment"],
    tickers: arr<string>(n.tickers).length ? arr<string>(n.tickers) : [text(n.ticker, "SPY")],
    publishedAt: text(n.publishedAt ?? n.published_at, new Date().toISOString()),
  }));
}

function normalizePulse(data: LivePulse): MarketPulse {
  const sectorMap = data.sector_performance;
  const sectors = Array.isArray(data.sectors)
    ? data.sectors as MarketPulse["sectors"]
    : sectorMap && typeof sectorMap === "object"
      ? Object.entries(sectorMap as Record<string, unknown>).map(([sector, change]) => ({ sector, change: num(change) }))
      : [];
  return {
    fearGreed: num(data.fearGreed ?? data.fear_greed_index),
    fearGreedLabel: text(data.fearGreedLabel ?? data.fear_greed_label, "Neutral"),
    vix: num(data.vix),
    sectors,
  };
}

export default function InvestPage() {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<InvestSignal[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [portfolio, setPortfolio] = useState<{
    paperPnl: number;
    paperPnlPct: number;
    openPositions: PortfolioPosition[];
    history: TradeHistoryItem[];
  } | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const [briefing, setBriefing] = useState<InvestSignal | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/invest/signals").then((r) => r.json()),
      fetch("/api/invest/watchlist").then((r) => r.json()),
      fetch("/api/invest/portfolio").then((r) => r.json()),
      fetch("/api/invest/news").then((r) => r.json()),
      fetch("/api/invest/market-pulse").then((r) => r.json()),
    ])
      .then(([sig, watch, port, newsData, pulseData]) => {
        setSignals(arr<LiveSignal>(sig.signals ?? sig).map(normalizeSignal));
        setWatchlist(arr<LiveWatchlistItem>(watch.items ?? watch).map(normalizeWatchlist));
        setPortfolio(normalizePortfolio(port));
        setNews(normalizeNews(newsData));
        setPulse(normalizePulse(pulseData));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading invest data..." />;
  if (!portfolio || !pulse) return <div className="text-red-500">Failed to load invest data</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Sentinel Invest" description="AI-driven signals and paper portfolio" />

      <section className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-medium text-gray-900 dark:text-white">Today&apos;s Signals</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Stop</th>
              <th className="px-4 py-3">Catalyst</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-medium">{s.ticker}</td>
                <td className="px-4 py-3">
                  {badge(
                    s.direction === "Long" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300",
                    s.direction
                  )}
                </td>
                <td className={`px-4 py-3 font-medium ${confidenceColor(s.confidence)}`}>
                  {s.confidence}%
                </td>
                <td className="px-4 py-3">${s.entryPrice.toLocaleString()}</td>
                <td className="px-4 py-3">${s.targetPrice.toLocaleString()}</td>
                <td className="px-4 py-3">${s.stopPrice.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {badge("bg-gray-700 text-gray-200", s.catalyst)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setBriefing(s)}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700"
                  >
                    Approve Trade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-medium text-gray-900 dark:text-white">Live Watchlist</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">1d %</th>
              <th className="px-4 py-3">AI Score</th>
              <th className="px-4 py-3">Chart</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((w) => (
              <tr key={w.ticker} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-medium">{w.ticker}</td>
                <td className="px-4 py-3">${w.price.toLocaleString()}</td>
                <td className={`px-4 py-3 ${w.change1d >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {w.change1d >= 0 ? "+" : ""}
                  {w.change1d}%
                </td>
                <td className="px-4 py-3">{w.aiScore}</td>
                <td className="px-4 py-3">
                  <Sparkline values={w.sparkline} positive={w.change1d >= 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-medium text-gray-900 dark:text-white">Portfolio</h2>
          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-sm text-gray-500">Paper P&amp;L</p>
              <p className={`text-2xl font-semibold ${portfolio.paperPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${portfolio.paperPnl.toLocaleString()} ({portfolio.paperPnlPct}%)
              </p>
            </div>
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-400">Open Positions</h3>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 text-left">Ticker</th>
                <th className="py-1">Dir</th>
                <th className="py-1">Entry</th>
                <th className="py-1">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.openPositions.map((p) => (
                <tr key={p.ticker} className="border-t border-gray-800">
                  <td className="py-2">{p.ticker}</td>
                  <td className="py-2 text-center">{p.direction}</td>
                  <td className="py-2 text-center">${p.entry}</td>
                  <td className={`py-2 text-right ${p.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${p.pnl} ({p.pnlPct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mt-4 text-sm font-medium text-gray-400">Trade History</h3>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 text-left">Ticker</th>
                <th className="py-1">Entry</th>
                <th className="py-1">Exit</th>
                <th className="py-1">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.history.map((t) => (
                <tr key={t.id} className="border-t border-gray-800">
                  <td className="py-2">{t.ticker}</td>
                  <td className="py-2 text-center">${t.entry}</td>
                  <td className="py-2 text-center">${t.exit}</td>
                  <td className={`py-2 text-right ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${t.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-medium text-gray-900 dark:text-white">News Feed</h2>
            <ul className="mt-3 space-y-3">
              {news.map((n) => (
                <li key={n.id} className="border-b border-gray-800 pb-3 text-sm last:border-0">
                  <div className="flex flex-wrap gap-2">
                    {badge(
                      n.sentiment === "bullish"
                        ? "bg-green-900 text-green-300"
                        : n.sentiment === "bearish"
                          ? "bg-red-900 text-red-300"
                          : "bg-gray-700 text-gray-300",
                      n.sentiment
                    )}
                    {n.tickers.map((t) => badge("bg-teal-900 text-teal-300", t))}
                  </div>
                  <p className="mt-1 text-gray-200">{n.headline}</p>
                  <p className="text-xs text-gray-500">
                    {n.source} · {new Date(n.publishedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-medium text-gray-900 dark:text-white">Market Pulse</h2>
            <div className="mt-4 flex items-center gap-6">
              <div className="text-center">
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4"
                  style={{
                    borderColor:
                      pulse.fearGreed > 75 ? "#22c55e" : pulse.fearGreed > 50 ? "#eab308" : "#ef4444",
                  }}
                >
                  <span className="text-xl font-bold">{pulse.fearGreed}</span>
                </div>
                <p className="mt-2 text-xs text-gray-400">Fear &amp; Greed — {pulse.fearGreedLabel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">VIX</p>
                <p className="text-2xl font-semibold text-white">{pulse.vix}</p>
              </div>
            </div>
            <h3 className="mt-4 text-sm text-gray-400">Sector Performance</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {pulse.sectors.map((s) => (
                <div
                  key={s.sector}
                  className={`rounded-lg p-2 text-center text-xs ${
                    s.change >= 0 ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"
                  }`}
                >
                  <p className="font-medium">{s.sector}</p>
                  <p>{s.change >= 0 ? "+" : ""}{s.change}%</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <TradeBriefingModal
        signal={briefing}
        onClose={() => setBriefing(null)}
        onPass={() => setBriefing(null)}
      />
    </div>
  );
}
