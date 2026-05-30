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
    <div className="toggle">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? "on" : ""}
          onClick={() => onChangeAction(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
