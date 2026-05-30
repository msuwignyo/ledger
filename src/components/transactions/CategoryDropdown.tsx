"use client";

import { useState } from "react";
import { getCategories } from "@/lib/storage";

export function CategoryDropdown({
  value,
  onChangeAction,
}: {
  value: string;
  onChangeAction: (category: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories] = useState(() => getCategories());

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium transition-colors"
        style={{ color: "#F5A623" }}
      >
        {value}
      </button>
      {open && (
        <div
          className="absolute z-10 mt-1 rounded-lg py-1 min-w-44 shadow-xl"
          style={{
            background: "#192030",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChangeAction(cat);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{
                color: cat === value ? "#F5A623" : "#7A80A0",
                fontWeight: cat === value ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (cat !== value) e.currentTarget.style.color = "#C8CCDF";
              }}
              onMouseLeave={(e) => {
                if (cat !== value) e.currentTarget.style.color = "#7A80A0";
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
