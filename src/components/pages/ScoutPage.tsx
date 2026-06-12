"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import type { ScoutApproval } from "@/lib/supabase";
import { LISTER_API } from "@/lib/config";
import { formatApiError } from "@/lib/api-error";

type ListResponse = {
  draft?: { id: string; title?: string };
  preview?: { title?: string };
};

type AlertState = {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
} | null;

export default function ScoutPage() {
  const [items, setItems] = useState<ScoutApproval[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

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

  const createListing = async (item: ScoutApproval) => {
    setCreatingId(item.id);
    setAlert(null);

    const payload = {
      input: item.url || item.title,
      title: item.title,
      url: item.url,
      price: item.price,
      source: item.source,
      approval_id: item.id,
      image: item.image,
    };

    try {
      // Direct HTTPS call — Netlify proxy times out (~40s) while listing takes 60–120s.
      const listRes = await fetch(`${LISTER_API.replace(/\/$/, "")}/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const listData = (await listRes.json().catch(() => ({}))) as ListResponse & {
        error?: string;
        detail?: unknown;
      };

      if (!listRes.ok) {
        throw new Error(formatApiError(listData, `Lister returned ${listRes.status}`));
      }

      const draftId = listData.draft?.id;
      let medusaMsg = "Draft created in Lister queue.";

      if (draftId) {
        const approveRes = await fetch("/api/lister/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", id: draftId }),
        });
        const approveData = await approveRes.json().catch(() => ({}));
        if (approveRes.ok) {
          medusaMsg = `Published to Medusa (product ${(approveData as { medusa_product_id?: string }).medusa_product_id || "created"}).`;
        } else {
          medusaMsg = `Draft created but Medusa publish failed: ${formatApiError(approveData, approveRes.statusText)}`;
        }
      }

      setAlert({
        variant: "success",
        title: "Listing created",
        message: `${listData.draft?.title || listData.preview?.title || item.title} — ${medusaMsg}`,
      });
      load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Create listing failed";
      setAlert({
        variant: "error",
        title: "Create listing failed",
        message,
      });
    } finally {
      setCreatingId(null);
    }
  };

  const rejectItem = async (id: string) => {
    setAlert(null);
    try {
      const res = await fetch("/api/scout/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(formatApiError(data, `Reject failed (${res.status})`));
      }
      load();
    } catch (e) {
      setAlert({
        variant: "error",
        title: "Reject failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const manualScan = async () => {
    setScanning(true);
    setAlert(null);
    try {
      const res = await fetch("/api/scout/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(formatApiError(data, `Scan failed (${res.status})`));
      }
      setAlert({ variant: "success", title: "Scan started", message: "Scout scan triggered." });
      load();
    } catch (e) {
      setAlert({
        variant: "error",
        title: "Scan failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
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

      {alert && (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

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
                filtered.map((row) => {
                  const isExpanded = expandedId === row.id;
                  const reasoning = row.reasoning ?? "—";
                  return (
                    <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td
                        className="max-w-[200px] px-4 py-3 font-medium break-words text-gray-900 dark:text-white"
                        title={row.title}
                      >
                        {row.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">${row.price ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${row.market_value ?? "—"}</td>
                      <td className="px-4 py-3">{row.source ?? "—"}</td>
                      <td className="px-4 py-3">{row.score ?? "—"}</td>
                      <td className="max-w-md px-4 py-3 text-gray-500">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          className={`w-full text-left break-words ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"}`}
                          title={reasoning !== "—" ? "Click to expand" : undefined}
                        >
                          {reasoning}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => createListing(row)}
                            disabled={creatingId === row.id}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700 disabled:opacity-50"
                          >
                            {creatingId === row.id ? "Creating…" : "Create Listing"}
                          </button>
                          <button
                            onClick={() => rejectItem(row.id)}
                            disabled={creatingId === row.id}
                            className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
