"use client";

import React, { useState, useEffect } from "react";

const MEDUSA_URL = "http://136.118.148.167:9000";

interface MedusaStatus {
  online: boolean;
  productCount: number | null;
  lastChecked: string | null;
}

export default function MedusaPage() {
  const [status, setStatus] = useState<MedusaStatus>({
    online: false,
    productCount: null,
    lastChecked: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    const now = new Date().toLocaleTimeString();
    try {
      const res = await fetch("/api/medusa/status", {
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      setStatus({
        online: data.online ?? false,
        productCount: data.productCount ?? null,
        lastChecked: now,
      });
    } catch {
      setStatus({ online: false, productCount: null, lastChecked: now });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medusa Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          E-commerce backend running on GCP · {MEDUSA_URL}
        </p>
      </div>

      {/* Open button */}
      <a
        href={`${MEDUSA_URL}/app`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-teal-500 hover:bg-teal-600 text-white text-lg font-semibold rounded-xl transition-colors shadow-md"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Open Medusa Admin
      </a>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Server Status</p>
          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse">Checking…</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status.online ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-lg font-bold ${status.online ? "text-green-600" : "text-red-500"}`}>
                {status.online ? "Online" : "Offline"}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Products</p>
          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {status.productCount !== null ? status.productCount : "—"}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Last Checked</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {status.lastChecked ?? "—"}
          </p>
        </div>
      </div>

      {/* Refresh + quick links */}
      <div className="flex items-center gap-3">
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Refreshing…" : "Refresh Status"}
        </button>
        <a
          href={`${MEDUSA_URL}/app/orders`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Orders →
        </a>
        <a
          href={`${MEDUSA_URL}/app/products`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Products →
        </a>
        <a
          href={`${MEDUSA_URL}/app/customers`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Customers →
        </a>
      </div>
    </div>
  );
}
