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
      className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide cursor-pointer select-none hover:text-zinc-700"
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
            className="block text-xs text-zinc-500 mb-1"
          >
            From
          </label>
          <input
            id="filter-start"
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="filter-end"
            className="block text-xs text-zinc-500 mb-1"
          >
            To
          </label>
          <input
            id="filter-end"
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="filter-category"
            className="block text-xs text-zinc-500 mb-1"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-zinc-400 pb-1.5">
          {filtered.length} transactions
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-zinc-400 text-sm"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm text-zinc-600 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-800 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                        tx.amount < 0 ? "text-red-600" : "text-emerald-600"
                      }`}
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
                    <td className="px-4 py-3 text-sm text-zinc-500 uppercase">
                      {tx.bank}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 max-w-xs truncate">
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
