"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Button from "@/components/ui/button/Button";
import type { ScoutApproval } from "@/lib/supabase";
import { LISTER_DIRECT_API } from "@/lib/config";

export default function ScoutPage() {
  const [items, setItems] = useState<ScoutApproval[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/scout")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (act: "approve" | "reject", id: string) => {
    if (act === "approve") {
      const item = items.find((row) => row.id === id);
      if (!item) return;
      const payload = {
        input: item.url || item.title,
        title: item.title,
        url: item.url,
        price: item.price,
        source: item.source,
        approval_id: item.id,
        image: item.image,
      };
      const target = `${LISTER_DIRECT_API.replace(/\/$/, "")}/list`;
      console.log("[Scout Create Listing] POST", target, payload);
      const res = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      console.log("[Scout Create Listing] response", res.status, data);
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `Lister returned ${res.status}`);
      }
      load();
      return;
    }
    await fetch("/api/scout/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, id }),
    });
    load();
  };

  const manualScan = async () => {
    setScanning(true);
    try {
      await fetch("/api/scout/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      load();
    } finally {
      setScanning(false);
    }
  };

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Scout"
        description="Review and approve deal discoveries"
        actions={
          <Button onClick={manualScan} disabled={scanning}>
            {scanning ? "Scanning..." : "Manual Scan"}
          </Button>
        }
      />
      <input
        type="text"
        placeholder="Filter by product name..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Reasoning</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No pending approvals
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.title}</td>
                    <td className="px-4 py-3">${row.price ?? "—"}</td>
                    <td className="px-4 py-3">${row.market_value ?? "—"}</td>
                    <td className="px-4 py-3">{row.source ?? "—"}</td>
                    <td className="px-4 py-3">{row.score ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500" title={row.reasoning ?? ""}>
                      {row.reasoning ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => action("approve", row.id)}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700"
                        >
                          Create Listing
                        </button>
                        <button
                          onClick={() => action("reject", row.id)}
                          className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
