import { describe, it, expect } from "vitest";
import {
  groupTransactions,
  filterByDateRange,
  computeSummary,
  getCategorySpending,
} from "./transactions";
import type { Transaction } from "./types";

const txs: Transaction[] = [
  { id: "1", date: "2026-04-01", description: "A", amount: -100000, category: "Dining", bank: "bca", sourceFile: "f.pdf" },
  { id: "2", date: "2026-04-15", description: "B", amount: -200000, category: "Transport", bank: "bca", sourceFile: "f.pdf" },
  { id: "3", date: "2026-05-01", description: "C", amount: -50000, category: "Dining", bank: "mandiri", sourceFile: "g.pdf" },
  { id: "4", date: "2026-05-10", description: "D", amount: 500000, category: "Other", bank: "bca", sourceFile: "g.pdf" }, // credit
];

describe("groupTransactions - monthly", () => {
  it("groups by month label", () => {
    const groups = groupTransactions(txs, "monthly");
    const labels = groups.map((g) => g.label);
    expect(labels).toContain("Apr 2026");
    expect(labels).toContain("May 2026");
  });

  it("sums expenses only (negative amounts)", () => {
    const groups = groupTransactions(txs, "monthly");
    const apr = groups.find((g) => g.label === "Apr 2026")!;
    expect(apr.total).toBe(300000);
  });
});

describe("filterByDateRange", () => {
  it("filters transactions within range (inclusive)", () => {
    const result = filterByDateRange(txs, "2026-04-01", "2026-04-30");
    expect(result).toHaveLength(2);
  });

  it("returns all when no range given", () => {
    expect(filterByDateRange(txs, null, null)).toHaveLength(4);
  });
});

describe("computeSummary", () => {
  it("returns total expenses, count, and top category", () => {
    const summary = computeSummary(txs);
    expect(summary.totalExpense).toBe(350000); // 100k+200k+50k, skips credit
    expect(summary.transactionCount).toBe(4);
    expect(summary.topCategory).toBe("Dining"); // appears twice
  });
});

describe("getCategorySpending", () => {
  it("returns expense totals per category", () => {
    const result = getCategorySpending(txs);
    const dining = result.find((c) => c.category === "Dining")!;
    expect(dining.total).toBe(150000);
  });

  it("excludes credits (positive amounts)", () => {
    const result = getCategorySpending(txs);
    const other = result.find((c) => c.category === "Other");
    expect(other).toBeUndefined();
  });
});
