"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { updatePassword } = useAuth();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [deployMsg, setDeployMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/keys")
      .then((r) => r.json())
      .then(setKeys);
  }, []);

  const changePassword = () => {
    if (newPw !== confirmPw) {
      setPwMsg("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwMsg("Password must be at least 8 characters");
      return;
    }
    updatePassword(newPw);
    setPwMsg("Password updated");
    setNewPw("");
    setConfirmPw("");
  };

  const triggerDeploy = async () => {
    setDeployMsg("Triggering...");
    const res = await fetch("/api/settings/deploy", { method: "POST" });
    const data = await res.json();
    setDeployMsg(data.ok ? "Deploy triggered!" : data.error || "Failed");
  };

  return (
    <div>
      <PageHeader title="Settings" description="Dashboard configuration" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-medium text-gray-900 dark:text-white">Master Password</h2>
          <p className="mt-1 text-sm text-gray-500">Default: sentinelprime2026</p>
          <div className="mt-4 grid max-w-md gap-3">
            <input
              type="password"
              placeholder="New password"
              className="rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm password"
              className="rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
            <Button onClick={changePassword}>Update Password</Button>
            {pwMsg && <p className="text-sm text-teal-500">{pwMsg}</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-medium text-gray-900 dark:text-white">API Keys</h2>
          <p className="mt-1 text-sm text-gray-500">Masked values from server environment</p>
          <dl className="mt-4 space-y-2 text-sm">
            {Object.entries(keys).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="capitalize text-gray-500">{k}</dt>
                <dd className="font-mono text-gray-900 dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-medium text-gray-900 dark:text-white">Netlify Deploy</h2>
          <p className="mt-1 text-sm text-gray-500">Trigger manual redeploy of sentinelprime.org</p>
          <Button className="mt-4" onClick={triggerDeploy}>Trigger Deploy</Button>
          {deployMsg && <p className="mt-2 text-sm text-teal-500">{deployMsg}</p>}
        </section>
      </div>
    </div>
  );
}
