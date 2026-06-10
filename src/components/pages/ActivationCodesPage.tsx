"use client";

import React, { useState, useEffect } from "react";
import { CopyIcon, CheckLineIcon } from "@/icons";

interface ActivationCode {
  id: string;
  code: string;
  email: string;
  product: string;
  type: string;
  status: string;
  created_at: string;
  activated_at?: string;
  stripe_customer_id?: string;
}

const PRODUCTS = [
  { value: "all", label: "All Products" },
  { value: "shield", label: "Sentinel Shield" },
  { value: "shift", label: "Shift by Sentinel" },
  { value: "earn", label: "Sentinel Earn" },
  { value: "sentinelai", label: "Sentinel AI" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "unused", label: "Unused" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

export default function ActivationCodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    email: "",
    product: "shield",
    type: "lifetime",
  });
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    try {
      const response = await fetch("/.netlify/functions/admin-codes");
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (err) {
      console.error("Failed to fetch codes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await fetch("/.netlify/functions/admin-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: generateForm.email,
          product: generateForm.product,
          type: generateForm.type,
          notes: "Manual admin generation",
        }),
      });
      const data = await response.json();
      if (data.code) {
        setGeneratedCode(data.code);
        fetchCodes();
      }
    } catch (err) {
      console.error("Failed to generate code:", err);
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredCodes = codes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(search.toLowerCase()) ||
      code.email.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = productFilter === "all" || code.product === productFilter;
    const matchesStatus = statusFilter === "all" || code.status === statusFilter;
    return matchesSearch && matchesProduct && matchesStatus;
  });

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      unused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      revoked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.unused}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activation Codes</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
        >
          Generate Code
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <input
          type="text"
          placeholder="Search by code or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
        />
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Total Codes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{codes.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {codes.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Unused</p>
          <p className="text-2xl font-bold text-yellow-600">
            {codes.filter((c) => c.status === "unused").length}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">Revoked</p>
          <p className="text-2xl font-bold text-red-600">
            {codes.filter((c) => ["revoked", "expired"].includes(c.status)).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Activated
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredCodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No codes found
                </td>
              </tr>
            ) : (
              filteredCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                    {code.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{code.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {PRODUCTS.find((p) => p.value === code.product)?.label || code.product}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(code.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(code.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(code.activated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyToClipboard(code.code, code.id)}
                      className="p-2 text-gray-500 hover:text-teal-500 transition"
                      title="Copy code"
                    >
                      {copiedId === code.id ? (
                        <CheckLineIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <CopyIcon className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Generate Activation Code</h2>
            {generatedCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Generated Code:</p>
                  <p className="font-mono text-lg font-bold text-green-600">{generatedCode}</p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedCode(null);
                    setShowGenerateModal(false);
                    setGenerateForm({ email: "", product: "shield", type: "lifetime" });
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={generateForm.email}
                    onChange={(e) => setGenerateForm({ ...generateForm, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product
                  </label>
                  <select
                    value={generateForm.product}
                    onChange={(e) => setGenerateForm({ ...generateForm, product: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                  >
                    {PRODUCTS.filter((p) => p.value !== "all").map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    License Type
                  </label>
                  <select
                    value={generateForm.type}
                    onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white"
                  >
                    <option value="lifetime">Lifetime</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50"
                  >
                    {generating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
