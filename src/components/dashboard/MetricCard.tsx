import React from "react";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "teal" | "amber" | "red" | "green";
};

const accents = {
  teal: "border-teal-500/30 bg-teal-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  red: "border-red-500/30 bg-red-500/5",
  green: "border-green-500/30 bg-green-500/5",
};

export default function MetricCard({ label, value, sub, accent = "teal" }: Props) {
  return (
    <div className={`rounded-2xl border p-5 dark:bg-gray-900 ${accents[accent]}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}
