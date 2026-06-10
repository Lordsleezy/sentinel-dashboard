"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ProductPrice = {
  key: string;
  name: string;
  price: number | null;
  stripePriceId: string | null;
};

type Coupon = {
  id: string;
  name: string | null;
  percentOff: number | null;
  amountOff: number | null;
  redeemBy: string | null;
  valid: boolean;
};

export default function StripePage() {
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [payments, setPayments] = useState<unknown[]>([]);
  const [mrrData, setMrrData] = useState<{ month: string; mrr: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponModal, setCouponModal] = useState(false);
  const [flashModal, setFlashModal] = useState(false);
  const [editPrice, setEditPrice] = useState<{ key: string; price: string } | null>(null);
  const [couponForm, setCouponForm] = useState({ name: "", percentOff: "", amountOff: "", expiryDate: "" });
  const [flashForm, setFlashForm] = useState({ productKey: "", salePrice: "", durationHours: "24", originalPrice: "" });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/stripe/prices").then((r) => r.json()),
      fetch("/api/stripe/coupons").then((r) => r.json()),
      fetch("/api/stripe/payments?limit=15").then((r) => r.json()),
      fetch("/api/stripe/mrr").then((r) => r.json()),
    ])
      .then(([prices, c, pay, mrr]) => {
        setProducts(prices.products || []);
        setCoupons(c.coupons || []);
        setPayments(pay.payments || []);
        setMrrData(mrr.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const savePrice = async () => {
    if (!editPrice) return;
    await fetch("/api/stripe/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editPrice.key, newPrice: Number(editPrice.price) }),
    });
    setEditPrice(null);
    load();
  };

  const createCoupon = async () => {
    await fetch("/api/stripe/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: couponForm.name,
        percentOff: couponForm.percentOff ? Number(couponForm.percentOff) : undefined,
        amountOff: couponForm.amountOff ? Number(couponForm.amountOff) : undefined,
        expiryDate: couponForm.expiryDate || undefined,
      }),
    });
    setCouponModal(false);
    load();
  };

  const endCoupon = async (id: string) => {
    await fetch(`/api/stripe/coupons?id=${id}`, { method: "DELETE" });
    load();
  };

  const createFlashDeal = async () => {
    await fetch("/api/stripe/flash-deal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: flashForm.productKey,
        salePrice: Number(flashForm.salePrice),
        durationHours: Number(flashForm.durationHours),
        originalPrice: flashForm.originalPrice ? Number(flashForm.originalPrice) : undefined,
      }),
    });
    setFlashModal(false);
    load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Stripe"
        description="Pricing, promotions, and revenue"
        actions={
          <>
            <Button variant="outline" onClick={() => setCouponModal(true)}>Create Coupon</Button>
            <Button onClick={() => setFlashModal(true)}>Flash Deal</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <div key={p.key} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{p.name}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              {p.price != null ? `$${p.price}` : "—"}
            </p>
            <button
              onClick={() => setEditPrice({ key: p.key, price: String(p.price ?? "") })}
              className="mt-2 text-sm text-teal-500 hover:underline"
            >
              Edit price
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 font-medium text-gray-900 dark:text-white">MRR — Last 12 Months</h2>
        {mrrData.length > 0 && (
          <Chart
            type="area"
            height={280}
            series={[{ name: "Revenue", data: mrrData.map((d) => d.mrr) }]}
            options={{
              chart: { toolbar: { show: false }, background: "transparent" },
              xaxis: { categories: mrrData.map((d) => d.month) },
              colors: ["#14b8a6"],
              theme: { mode: "dark" },
              stroke: { curve: "smooth" },
              dataLabels: { enabled: false },
            }}
          />
        )}
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="border-b px-4 py-3 dark:border-gray-800">
          <h2 className="font-medium text-gray-900 dark:text-white">Active Promotions</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Discount</th>
              <th className="px-4 py-2 text-left">Expires</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No active coupons</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-t dark:border-gray-800">
                  <td className="px-4 py-2">{c.name || c.id}</td>
                  <td className="px-4 py-2">
                    {c.percentOff ? `${c.percentOff}%` : c.amountOff ? `$${c.amountOff}` : "—"}
                  </td>
                  <td className="px-4 py-2">{c.redeemBy ? new Date(c.redeemBy).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => endCoupon(c.id)} className="text-red-500 hover:underline">End deal</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="border-b px-4 py-3 dark:border-gray-800">
          <h2 className="font-medium text-gray-900 dark:text-white">Recent Payments</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(payments as { id: string; created: string; amount: number; status: string }[]).map((p) => (
              <tr key={p.id} className="border-t dark:border-gray-800">
                <td className="px-4 py-2">{new Date(p.created).toLocaleString()}</td>
                <td className="px-4 py-2">${p.amount?.toFixed(2)}</td>
                <td className="px-4 py-2 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editPrice} onClose={() => setEditPrice(null)} className="max-w-sm p-6 m-4">
        {editPrice && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Edit Price</h2>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={editPrice.price}
              onChange={(e) => setEditPrice({ ...editPrice, price: e.target.value })}
            />
            <Button onClick={savePrice}>Update Stripe + Medusa + GitHub</Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={couponModal} onClose={() => setCouponModal(false)} className="max-w-md p-6 m-4">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Create Coupon</h2>
        <div className="space-y-3">
          <input placeholder="Name" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })} />
          <input placeholder="% off" type="number" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={couponForm.percentOff} onChange={(e) => setCouponForm({ ...couponForm, percentOff: e.target.value })} />
          <input placeholder="$ off" type="number" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={couponForm.amountOff} onChange={(e) => setCouponForm({ ...couponForm, amountOff: e.target.value })} />
          <input type="date" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={couponForm.expiryDate} onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })} />
          <Button onClick={createCoupon}>Create</Button>
        </div>
      </Modal>

      <Modal isOpen={flashModal} onClose={() => setFlashModal(false)} className="max-w-md p-6 m-4">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Flash Deal</h2>
        <div className="space-y-3">
          <select className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={flashForm.productKey} onChange={(e) => setFlashForm({ ...flashForm, productKey: e.target.value })}>
            <option value="">Select product</option>
            {products.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
          <input placeholder="Sale price" type="number" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={flashForm.salePrice} onChange={(e) => setFlashForm({ ...flashForm, salePrice: e.target.value })} />
          <input placeholder="Original price (optional)" type="number" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={flashForm.originalPrice} onChange={(e) => setFlashForm({ ...flashForm, originalPrice: e.target.value })} />
          <input placeholder="Duration (hours)" type="number" className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={flashForm.durationHours} onChange={(e) => setFlashForm({ ...flashForm, durationHours: e.target.value })} />
          <Button onClick={createFlashDeal}>Launch Flash Deal</Button>
        </div>
      </Modal>
    </div>
  );
}
