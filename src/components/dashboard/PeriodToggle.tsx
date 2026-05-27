"use client";

import type { Period } from "@/lib/types";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
];

export function PeriodToggle({
  value,
  onChangeAction,
}: {
  value: Period;
  onChangeAction: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 bg-zinc-100 p-1 rounded-full">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChangeAction(opt.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
