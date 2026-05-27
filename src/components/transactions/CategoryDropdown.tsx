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
  const categories = getCategories();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg min-w-40 py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChangeAction(cat);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 ${
                cat === value ? "text-indigo-600 font-medium" : "text-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
