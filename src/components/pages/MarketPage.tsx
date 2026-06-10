"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import { MARKET_URL } from "@/lib/config";
import type { MedusaProduct } from "@/lib/medusa";

export default function MarketPage() {
  const [products, setProducts] = useState<MedusaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/market")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateProduct = async (id: string, body: object) => {
    await fetch(`/api/market/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/market/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <PageHeader title="Market" description="Manage Medusa storefront products" />
      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const variant = p.variants?.[0];
                  const priceDollars = variant?.prices?.[0]?.amount
                    ? variant.prices[0].amount / 100
                    : 0;
                  return (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.title}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-24 rounded border px-2 py-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          defaultValue={priceDollars}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== String(priceDollars) && variant) {
                              updateProduct(p.id, { price: Number(val), variantId: variant.id });
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            updateProduct(p.id, {
                              status: p.status === "published" ? "draft" : "published",
                            })
                          }
                          className={`rounded-full px-3 py-1 text-xs ${
                            p.status === "published"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <a
                            href={`${MARKET_URL}/products/${p.handle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-500 hover:underline"
                          >
                            View
                          </a>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="text-red-500 hover:underline"
                          >
                            Delete
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
