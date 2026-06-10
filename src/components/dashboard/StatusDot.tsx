import React from "react";

export default function StatusDot({
  ok,
  label,
  ms,
}: {
  ok: boolean;
  label?: string;
  ms?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
        title={ok ? "Online" : "Offline"}
      />
      {label && <span className="text-gray-700 dark:text-gray-300">{label}</span>}
      {ms !== undefined && (
        <span className="text-gray-500 dark:text-gray-400">{ms}ms</span>
      )}
    </span>
  );
}
