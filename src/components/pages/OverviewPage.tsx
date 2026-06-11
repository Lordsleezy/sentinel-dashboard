"use client";

import React, { useCallback, useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusDot from "@/components/dashboard/StatusDot";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Button from "@/components/ui/button/Button";
import { authHeaders } from "@/lib/api-token";

type Overview = {
  mrr: number;
  subscribers: number;
  activeProducts: number;
  pendingScout: number;
  pendingLister: number;
  legion: { ok: boolean; ms: number };
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    description: string;
  }[];
};

type LegionStatus = { online: boolean; ms: number };

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [legionStatus, setLegionStatus] = useState<LegionStatus | null>(null);
  const [legionAction, setLegionAction] = useState("");

  const loadOverview = useCallback(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const loadLegionStatus = useCallback(() => {
    fetch("/api/legion/status")
      .then((r) => r.json())
      .then(setLegionStatus);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadLegionStatus();
    const interval = setInterval(loadLegionStatus, 30000);
    return () => clearInterval(interval);
  }, [loadLegionStatus]);

  const wakeLegion = async () => {
    setLegionAction("Waking...");
    const res = await fetch("/api/legion/wake", { method: "POST" });
    const body = await res.json();
    setLegionAction(body.status || body.error || "Done");
    setTimeout(loadLegionStatus, 3000);
  };

  const shutdownLegion = async () => {
    if (!confirm("Shut down Legion now? Scout and Lister will go offline.")) return;
    setLegionAction("Shutting down...");
    const res = await fetch("/api/legion/shutdown", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
    });
    const body = await res.json();
    setLegionAction(body.status || body.error || "Done");
    setTimeout(loadLegionStatus, 5000);
  };

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-red-500">Failed to load overview</div>;

  const online = legionStatus?.online ?? data.legion.ok;
  const legionMs = legionStatus?.ms ?? data.legion.ms;

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Sentinel Prime operations overview"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="MRR" value={`$${data.mrr.toLocaleString()}`} />
        <MetricCard label="Subscribers" value={data.subscribers} accent="green" />
        <MetricCard label="Active Products" value={data.activeProducts} />
        <MetricCard label="Pending Scout" value={data.pendingScout} accent="amber" />
        <MetricCard label="Pending Lister" value={data.pendingLister} accent="amber" />
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Legion Status</p>
          <div className="mt-3">
            <StatusDot
              ok={online}
              label={online ? "Online" : "Offline"}
              ms={legionMs}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">scout.sentinelprime.org</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!online && (
              <Button size="sm" onClick={wakeLegion}>
                Wake
              </Button>
            )}
            {online && (
              <button
                type="button"
                onClick={shutdownLegion}
                className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs text-white hover:bg-red-700"
              >
                Shutdown
              </button>
            )}
          </div>
          {legionAction && (
            <p className="mt-2 text-xs text-teal-500">{legionAction}</p>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-medium text-gray-900 dark:text-white">Recent Stripe Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
              <tr>
                <th className="px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="px-5 py-3 font-medium text-gray-500">Amount</th>
                <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="px-5 py-3 font-medium text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    No payments — configure STRIPE_SECRET_KEY
                  </td>
                </tr>
              ) : (
                data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {new Date(p.created).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-white">
                      ${p.amount.toFixed(2)} {p.currency.toUpperCase()}
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-700 dark:text-gray-300">{p.status}</td>
                    <td className="px-5 py-3 text-gray-500">{p.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
