"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/types";
import { CategoryDropdown } from "./CategoryDropdown";

type SortKey = keyof Pick<
  Transaction,
  "date" | "description" | "amount" | "category" | "bank"
>;
type SortDir = "asc" | "desc";

function formatIDR(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("id-ID");
  return amount < 0 ? `-Rp ${abs}` : `+Rp ${abs}`;
}

type SortHeaderProps = {
  col: SortKey;
  label: string;
  active: boolean;
  dir: SortDir;
  onSortAction: (k: SortKey) => void;
};

function SortHeader({
  col,
  label,
  active,
  dir,
  onSortAction,
}: SortHeaderProps) {
  return (
    <th
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors"
      style={{ color: active ? "#9AA0BE" : "#3D4465" }}
      onClick={() => onSortAction(col)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onSortAction(col)
      }
      tabIndex={0}
    >
      {label}{" "}
      {active ? (
        dir === "asc" ? (
          "↑"
        ) : (
          "↓"
        )
      ) : (
        <span className="opacity-30">↕</span>
      )}
    </th>
  );
}

export function TransactionTable({
  transactions,
  onCategoryChangeAction,
}: {
  transactions: Transaction[];
  onCategoryChangeAction: (id: string, category: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const categories = [
    "all",
    ...Array.from(new Set(transactions.map((t) => t.category))).sort(),
  ];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = transactions
    .filter((t) => filterCategory === "all" || t.category === filterCategory)
    .filter((t) => !filterStart || t.date >= filterStart)
    .filter((t) => !filterEnd || t.date <= filterEnd)
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label
            htmlFor="filter-start"
            className="block text-xs uppercase tracking-wider mb-1.5 font-medium"
            style={{ color: "#3D4465" }}
          >
            From
          </label>
          <input
            id="filter-start"
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{
              background: "#192030",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#9AA0BE",
              colorScheme: "dark",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="filter-end"
            className="block text-xs uppercase tracking-wider mb-1.5 font-medium"
            style={{ color: "#3D4465" }}
          >
            To
          </label>
          <input
            id="filter-end"
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{
              background: "#192030",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#9AA0BE",
              colorScheme: "dark",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="filter-category"
            className="block text-xs uppercase tracking-wider mb-1.5 font-medium"
            style={{ color: "#3D4465" }}
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{
              background: "#192030",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#9AA0BE",
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: "#192030" }}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm pb-1.5 font-mono" style={{ color: "#3D4465" }}>
          {filtered.length} transactions
        </p>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "#111722",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <tr style={{ background: "#0F1520" }}>
                <SortHeader
                  col="date"
                  label="Date"
                  active={sortKey === "date"}
                  dir={sortDir}
                  onSortAction={handleSort}
                />
                <SortHeader
                  col="description"
                  label="Description"
                  active={sortKey === "description"}
                  dir={sortDir}
                  onSortAction={handleSort}
                />
                <SortHeader
                  col="amount"
                  label="Amount"
                  active={sortKey === "amount"}
                  dir={sortDir}
                  onSortAction={handleSort}
                />
                <SortHeader
                  col="category"
                  label="Category"
                  active={sortKey === "category"}
                  dir={sortDir}
                  onSortAction={handleSort}
                />
                <SortHeader
                  col="bank"
                  label="Bank"
                  active={sortKey === "bank"}
                  dir={sortDir}
                  onSortAction={handleSort}
                />
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "#3D4465" }}
                >
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm"
                    style={{ color: "#3D4465" }}
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.025)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td
                      className="px-4 py-3 text-sm whitespace-nowrap font-mono"
                      style={{ color: "#5C6280" }}
                    >
                      {tx.date}
                    </td>
                    <td
                      className="px-4 py-3 text-sm max-w-xs truncate"
                      style={{ color: "#C8CCDF" }}
                    >
                      {tx.description}
                    </td>
                    <td
                      className="px-4 py-3 text-sm font-medium whitespace-nowrap font-mono"
                      style={{
                        color: tx.amount < 0 ? "#F87171" : "#4ADE80",
                      }}
                    >
                      {formatIDR(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryDropdown
                        value={tx.category}
                        onChangeAction={(cat) =>
                          onCategoryChangeAction(tx.id, cat)
                        }
                      />
                    </td>
                    <td
                      className="px-4 py-3 text-xs uppercase tracking-wider font-medium"
                      style={{ color: "#4A5070" }}
                    >
                      {tx.bank}
                    </td>
                    <td
                      className="px-4 py-3 text-xs max-w-xs truncate"
                      style={{ color: "#3D4465" }}
                    >
                      {tx.sourceFile}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
