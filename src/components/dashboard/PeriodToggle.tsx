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
    <div
      className="flex gap-0.5 p-1 rounded-lg"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChangeAction(opt.value)}
          className="px-3.5 py-1.5 rounded-md text-sm font-medium transition-all"
          style={
            value === opt.value
              ? {
                  background: "rgba(255,255,255,0.10)",
                  color: "#E4E8F5",
                }
              : {
                  color: "rgba(228,232,245,0.55)",
                }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
