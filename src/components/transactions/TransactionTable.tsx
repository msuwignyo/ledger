"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/types";
import { CategoryDropdown } from "./CategoryDropdown";

type SortKey = keyof Pick<Transaction, "date" | "description" | "amount" | "category" | "bank">;
type SortDir = "asc" | "desc";

function formatIDR(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("id-ID");
  return amount < 0 ? `-Rp ${abs}` : `+Rp ${abs}`;
}

function SortTh({
  col,
  label,
  num,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey;
  label: string;
  num?: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  const arrow = active ? (sortDir === "asc" ? "↑" : "↓") : "↕";
  return (
    <th
      className={num ? "num" : ""}
      onClick={() => onSort(col)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSort(col)}
      tabIndex={0}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}{" "}
      <span className={active ? "sar" : ""} style={{ opacity: active ? 1 : 0.35 }}>
        {arrow}
      </span>
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
  const [filterCategory, setFilterCategory] = useState("all");
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
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
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
    <div>
      <div className="filters">
        <div className="field">
          <label htmlFor="f-start">From</label>
          <input
            id="f-start"
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-end">To</label>
          <input
            id="f-end"
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-cat">Category</label>
          <select
            id="f-cat"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>
        <div className="field__count">{filtered.length} entries</div>
      </div>

      <div className="ledger-table-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <SortTh col="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="description" label="Description" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="category" label="Category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="bank" label="Bank" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="amount" label="Amount" num sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "44px",
                    fontStyle: "italic",
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-faint)",
                  }}
                >
                  No entries match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="td-date">{tx.date}</td>
                  <td className="td-desc">{tx.description}</td>
                  <td>
                    <CategoryDropdown
                      value={tx.category}
                      onChangeAction={(cat) => onCategoryChangeAction(tx.id, cat)}
                    />
                  </td>
                  <td>
                    <span className="td-bank">
                      <span className="bank-tag">{tx.bank}</span>
                    </span>
                  </td>
                  <td className={`td-amt ${tx.amount < 0 ? "expense" : "credit"}`}>
                    {formatIDR(tx.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
