"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import type { ListerDraft } from "@/lib/supabase";
import { formatApiError } from "@/lib/api-error";

type AlertState = {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
} | null;

type ApproveResponse = {
  medusa_product_id?: string;
  message?: string;
};

export default function ListerPage() {
  const [items, setItems] = useState<ListerDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [viewDraft, setViewDraft] = useState<ListerDraft | null>(null);
  const [editDraft, setEditDraft] = useState<ListerDraft | null>(null);
  const [listModal, setListModal] = useState(false);
  const [listInput, setListInput] = useState("");

  const reloadItems = useCallback(async () => {
    const res = await fetch("/api/lister");
    const data = await res.json();
    setItems(data.items || []);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    reloadItems().finally(() => setLoading(false));
  }, [reloadItems]);

  useEffect(() => {
    load();
  }, [load]);

  const runProxyAction = async (
    action: "approve" | "reject" | "list",
    id?: string,
    payload?: object
  ) => {
    const res = await fetch("/api/lister/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatApiError(data, `${action} failed (${res.status})`));
    }
    return data;
  };

  const handleApprove = async (row: ListerDraft) => {
    if (!row.id) {
      setAlert({ variant: "error", title: "Approve failed", message: "Draft has no id." });
      return;
    }
    if (actingId) return;

    setActingId(row.id);
    setAlert(null);
    try {
      const data = (await runProxyAction("approve", row.id)) as ApproveResponse;
      setAlert({
        variant: "success",
        title: "Published to Medusa",
        message: `${row.title || row.input} — ${data.message || "approved"}${data.medusa_product_id ? ` (${data.medusa_product_id})` : ""}`,
      });
      await reloadItems();
    } catch (e) {
      setAlert({
        variant: "error",
        title: "Approve failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (row: ListerDraft) => {
    if (!row.id || actingId) return;
    setActingId(row.id);
    setAlert(null);
    try {
      await runProxyAction("reject", row.id);
      setAlert({
        variant: "success",
        title: "Draft rejected",
        message: row.title || row.input,
      });
      await reloadItems();
    } catch (e) {
      setAlert({
        variant: "error",
        title: "Reject failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setActingId(null);
    }
  };

  const handleManualList = async () => {
    if (!listInput.trim() || actingId) return;
    setActingId("manual-list");
    setAlert(null);
    try {
      await runProxyAction("list", undefined, { input: listInput.trim() });
      setAlert({
        variant: "success",
        title: "Listing created",
        message: "Draft added to the queue.",
      });
      setListModal(false);
      setListInput("");
      await reloadItems();
    } catch (e) {
      setAlert({
        variant: "error",
        title: "List failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setActingId(null);
    }
  };

  const saveEdit = async () => {
    if (!editDraft || actingId) return;
    setActingId(editDraft.id);
    setAlert(null);
    try {
      const res = await fetch("/api/lister", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editDraft.id,
          title: editDraft.title,
          description: editDraft.description,
          price: editDraft.price,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(formatApiError(data, `Save failed (${res.status})`));
      }
      setEditDraft(null);
      setAlert({ variant: "success", title: "Draft saved", message: "Changes updated." });
      await reloadItems();
    } catch (e) {
      setAlert({
        variant: "error",
        title: "Save failed",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setActingId(null);
    }
  };

  const isPending = (row: ListerDraft) => (row.status || "pending").toLowerCase() === "pending";

  return (
    <div>
      <PageHeader
        title="Lister"
        description="Review product listing drafts"
        actions={<Button onClick={() => setListModal(true)}>Manual List</Button>}
      />

      {alert && (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Source URL</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Retailer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No pending drafts
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {row.title || row.input}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3">
                      {row.source_url ? (
                        <a href={row.source_url} target="_blank" rel="noreferrer" className="text-teal-500 hover:underline">
                          {row.source_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">${row.price ?? "—"}</td>
                    <td className="px-4 py-3">{row.retailer ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setViewDraft(row)} className="text-xs text-teal-500 hover:underline">
                          View
                        </button>
                        <button type="button" onClick={() => setEditDraft({ ...row })} className="text-xs text-teal-500 hover:underline">
                          Edit
                        </button>
                        {isPending(row) && (
                          <>
                            <button
                              type="button"
                              disabled={!!actingId}
                              onClick={() => void handleApprove(row)}
                              className="rounded-lg bg-teal-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                            >
                              {actingId === row.id ? "Approving…" : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={!!actingId}
                              onClick={() => void handleReject(row)}
                              className="rounded-lg bg-red-600/80 px-2 py-1 text-xs text-white disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!viewDraft} onClose={() => setViewDraft(null)} className="max-w-2xl p-6 m-4">
        {viewDraft && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewDraft.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{viewDraft.description}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
              {(viewDraft.features || []).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <pre className="max-h-48 overflow-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
              {JSON.stringify(viewDraft.generated_listing, null, 2)}
            </pre>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editDraft} onClose={() => setEditDraft(null)} className="max-w-lg p-6 m-4">
        {editDraft && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Draft</h2>
            <input
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={editDraft.title || ""}
              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
              placeholder="Title"
            />
            <textarea
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              rows={4}
              value={editDraft.description || ""}
              onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
              placeholder="Description"
            />
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={editDraft.price ?? ""}
              onChange={(e) => setEditDraft({ ...editDraft, price: Number(e.target.value) })}
              placeholder="Price"
            />
            <Button onClick={() => void saveEdit()} disabled={actingId === editDraft.id}>
              {actingId === editDraft.id ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={listModal} onClose={() => setListModal(false)} className="max-w-lg p-6 m-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Manual List</h2>
        <textarea
          className="mb-4 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          rows={4}
          value={listInput}
          onChange={(e) => setListInput(e.target.value)}
          placeholder="Paste product URL or description..."
        />
        <Button onClick={() => void handleManualList()} disabled={actingId === "manual-list" || !listInput.trim()}>
          {actingId === "manual-list" ? "Submitting…" : "Submit"}
        </Button>
      </Modal>
    </div>
  );
}
