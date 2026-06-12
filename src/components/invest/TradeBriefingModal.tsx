"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import type { InvestSignal } from "@/lib/invest-mock";

export default function TradeBriefingModal({
  signal,
  onClose,
  onPass,
}: {
  signal: InvestSignal | null;
  onClose: () => void;
  onPass: () => void;
}) {
  const [status, setStatus] = useState("");

  if (!signal) return null;

  const rr = signal.dollarRisk > 0 ? (signal.expectedReward / signal.dollarRisk).toFixed(2) : "—";

  const confirmTrade = async () => {
    setStatus("Submitting...");
    const res = await fetch("/api/invest/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: signal.ticker,
        side: signal.direction === "Short" ? "sell" : "buy",
        qty: 1,
        entry_price: signal.entryPrice,
        take_profit: signal.targetPrice,
        stop_loss: signal.stopPrice,
      }),
    });
    const data = await res.json();
    setStatus(data.message || data.error || (res.ok ? "Trade confirmed" : "Failed"));
    if (res.ok || data.mock) setTimeout(onClose, 1200);
  };

  return (
    <Modal isOpen={!!signal} onClose={onClose} className="max-w-3xl p-6 m-4 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold text-white">
        Trade Briefing — {signal.ticker} ({signal.direction})
      </h2>

      <section className="mt-6">
        <h3 className="text-sm font-medium text-teal-400">Technical Setup</h3>
        <p className="mt-1 text-sm text-gray-300">{signal.technicalSetup}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
          <span>RSI: {signal.rsi}</span>
          <span>MACD: {signal.macd}</span>
          <span>{signal.volumeSummary}</span>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-medium text-teal-400">News Catalyst</h3>
        <ul className="mt-2 space-y-2">
          {(signal.newsHeadlines || []).map((n, i) => (
            <li key={i} className="text-sm text-gray-300">
              <span
                className={`mr-2 rounded px-1.5 py-0.5 text-xs ${
                  n.sentiment === "bullish" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                }`}
              >
                {n.sentiment}
              </span>
              {n.title}
              <span className="ml-2 text-gray-500">— {n.source}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-teal-400">Bull Case</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-300">
            {(signal.bullCase || []).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-teal-400">Bear Case</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-300">
            {(signal.bearCase || []).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-gray-800 p-4">
        <h3 className="text-sm font-medium text-teal-400">Risk Snapshot</h3>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Dollar Risk</p>
            <p className="text-red-400">${signal.dollarRisk.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Expected Reward</p>
            <p className="text-green-400">${signal.expectedReward.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">R/R Ratio</p>
            <p className="text-white">{rr}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Button onClick={confirmTrade}>Confirm Trade</Button>
        <Button variant="outline" onClick={onPass}>
          Pass
        </Button>
      </div>
      {status && <p className="mt-3 text-sm text-teal-500">{status}</p>}
    </Modal>
  );
}
