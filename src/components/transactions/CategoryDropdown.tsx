"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span className="cat-edit" ref={ref}>
      <button
        type="button"
        className="cat-btn"
        onClick={() => setOpen((o) => !o)}
      >
        {value}
      </button>
      {open && (
        <div className="cat-menu">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={cat === value ? "sel" : ""}
              onClick={() => {
                onChangeAction(cat);
                setOpen(false);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
