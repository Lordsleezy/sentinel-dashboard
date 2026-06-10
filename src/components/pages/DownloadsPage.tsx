"use client";

import React, { useState, useEffect } from "react";

interface DownloadClick {
  id: string;
  product: string;
  page: string;
  clicked_at: string;
  referrer: string | null;
  ip_address: string | null;
  city: string | null;
  country: string | null;
}

interface ProductStats {
  product: string;
  count: number;
}

const PRODUCTS = [
  { value: "all", label: "All Products" },
  { value: "shield", label: "Sentinel Shield" },
  { value: "shift", label: "Shift by Sentinel" },
  { value: "earn", label: "Sentinel Earn" },
  { value: "sentinelai", label: "Sentinel AI" },
];

export default function DownloadsPage() {
  const [clicks, setClicks] = useState<DownloadClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("all");
  const [dateRange, setDateRange] = useState(30); // days

  useEffect(() => {
    fetchDownloads();
  }, [productFilter, dateRange]);

  async function fetchDownloads() {
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/admin-downloads");
      const data = await res.json();
      setClicks(data.clicks || []);
    } catch (err) {
      console.error("Failed to fetch downloads:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const productStats: ProductStats[] = PRODUCTS.filter(p => p.value !== "all").map(p => ({
    product: p.label,
    count: clicks.filter(c => c.product === p.value).length
  }));

  const totalClicks = clicks.length;

  // Filter clicks based on selected product
  const filteredClicks = productFilter === "all"
    ? clicks
    : clicks.filter(c => c.product === productFilter);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Download Analytics</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
        >
          {PRODUCTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Total Downloads</p>
          <p className="text-2xl font-bold text-teal-600">{totalClicks}</p>
        </div>
        {productStats.slice(0, 3).map((stat) => (
          <div key={stat.product} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.product}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart - Product Breakdown */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Downloads by Product</h2>
        <div className="space-y-3">
          {productStats.map((stat) => {
            const percentage = totalClicks > 0 ? (stat.count / totalClicks) * 100 : 0;
            return (
              <div key={stat.product} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 dark:text-gray-400">{stat.product}</div>
                <div className="flex-1 h-8 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {stat.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line Chart - Timeline (simplified) */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Downloads Over Time (Last {dateRange} Days)
        </h2>
        <div className="h-64 flex items-end gap-2">
          {/* Simple bar chart for last 7 days */}
          {Array.from({ length: 7 }).map((_, i) => {
            const dayClicks = clicks.filter(c => {
              const clickDate = new Date(c.clicked_at);
              const dayAgo = new Date();
              dayAgo.setDate(dayAgo.getDate() - (6 - i));
              return clickDate.toDateString() === dayAgo.toDateString();
            }).length;
            const maxClicks = Math.max(...Array.from({ length: 7 }).map((_, j) =>
              clicks.filter(c => {
                const clickDate = new Date(c.clicked_at);
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - (6 - j));
                return clickDate.toDateString() === dayAgo.toDateString();
              }).length
            ), 1);
            const height = (dayClicks / maxClicks) * 100;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-teal-500 rounded-t transition-all duration-500"
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                <div className="text-xs text-gray-500">
                  {new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString(undefined, { weekday: "short" })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Downloads</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Page
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Referrer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                IP Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                City
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredClicks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No downloads found
                </td>
              </tr>
            ) : (
              filteredClicks.slice(0, 50).map((click) => (
                <tr key={click.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {PRODUCTS.find((p) => p.value === click.product)?.label || click.product}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{click.page}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {click.referrer || "Direct"}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {click.ip_address || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {click.city ? `${click.city}${click.country ? `, ${click.country}` : ""}` : (click.country || "—")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(click.clicked_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
