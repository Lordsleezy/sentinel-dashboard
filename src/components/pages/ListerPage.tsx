"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { LISTER_API } from "@/lib/config";
import type { ListerDraft } from "@/lib/supabase";

export default function ListerPage() {
  const [items, setItems] = useState<ListerDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDraft, setViewDraft] = useState<ListerDraft | null>(null);
  const [editDraft, setEditDraft] = useState<ListerDraft | null>(null);
  const [listModal, setListModal] = useState(false);
  const [listInput, setListInput] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/lister")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const listerAction = async (path: string, body?: object) => {
    await fetch(`${LISTER_API}${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    load();
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    await fetch("/api/lister", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editDraft.id,
        title: editDraft.title,
        description: editDraft.description,
        price: editDraft.price,
      }),
    });
    setEditDraft(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Lister"
        description="Review product listing drafts"
        actions={<Button onClick={() => setListModal(true)}>Manual List</Button>}
      />
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
                        <button onClick={() => setViewDraft(row)} className="text-xs text-teal-500 hover:underline">
                          View
                        </button>
                        <button onClick={() => setEditDraft({ ...row })} className="text-xs text-teal-500 hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => listerAction(`/approve/${row.id}`)}
                          className="rounded-lg bg-teal-600 px-2 py-1 text-xs text-white"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => listerAction(`/reject/${row.id}`)}
                          className="rounded-lg bg-red-600/80 px-2 py-1 text-xs text-white"
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

      <Modal isOpen={!!viewDraft} onClose={() => setViewDraft(null)} className="max-w-2xl p-6 m-4">
        {viewDraft && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewDraft.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{viewDraft.description}</p>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Features</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                {(viewDraft.features || []).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {(viewDraft.images || []).map((img, i) => (
                <img key={i} src={img} alt="" className="h-24 rounded-lg object-cover" />
              ))}
            </div>
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
            <Button onClick={saveEdit}>Save Changes</Button>
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
        <Button
          onClick={async () => {
            await listerAction("/list", { input: listInput });
            setListModal(false);
            setListInput("");
          }}
        >
          Submit
        </Button>
      </Modal>
    </div>
  );
}
