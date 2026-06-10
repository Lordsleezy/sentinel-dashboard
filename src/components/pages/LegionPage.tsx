"use client";

import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import LoadingState from "@/components/dashboard/LoadingState";
import StatusDot from "@/components/dashboard/StatusDot";
import Button from "@/components/ui/button/Button";
import { LEGION_URL } from "@/lib/config";

type ServiceHealth = { name: string; ok: boolean; ms: number; url: string };

export default function LegionPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [wolStatus, setWolStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/legion/health")
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const wakeOnLan = async () => {
    setWolStatus("Sending...");
    const res = await fetch("/api/wol", { method: "POST" });
    const data = await res.json();
    setWolStatus(data.message || data.error || "Done");
  };

  return (
    <div>
      <PageHeader
        title="Legion"
        description="Homelab infrastructure health and controls"
        actions={<Button onClick={load}>Refresh</Button>}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{svc.name}</h3>
              <div className="mt-3">
                <StatusDot ok={svc.ok} ms={svc.ms} />
              </div>
              <p className="mt-2 truncate text-xs text-gray-500">{svc.url}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-medium text-gray-900 dark:text-white">Wake on LAN</h3>
          <p className="mt-1 text-sm text-gray-500">Wake the Legion machine remotely</p>
          <Button className="mt-4" onClick={wakeOnLan}>Send Magic Packet</Button>
          {wolStatus && <p className="mt-2 text-sm text-teal-500">{wolStatus}</p>}
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-medium text-gray-900 dark:text-white">Quick Links</h3>
          <div className="mt-3 flex flex-col gap-2">
            <a href="https://ssh.sentinelprime.org/wetty" target="_blank" rel="noreferrer" className="text-teal-500 hover:underline">
              SSH Terminal →
            </a>
            <a
              href={`${LEGION_URL.replace("https://", "https://uptime.")}/`}
              target="_blank"
              rel="noreferrer"
              className="text-teal-500 hover:underline"
            >
              Uptime Kuma →
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Uptime Kuma</h3>
        <iframe
          src="https://uptime.legion.sentinelprime.org"
          className="h-96 w-full rounded-lg border-0 bg-gray-950"
          title="Uptime Kuma"
          sandbox="allow-scripts allow-same-origin"
        />
        <p className="mt-2 text-xs text-gray-500">
          If embed is blocked, use the Uptime Kuma link above.
        </p>
      </div>
    </div>
  );
}
