"use client";

import React, { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusDot from "@/components/dashboard/StatusDot";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";

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

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-red-500">Failed to load overview</div>;

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
            <StatusDot ok={data.legion.ok} label="legion.sentinelprime.org" ms={data.legion.ms} />
          </div>
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
