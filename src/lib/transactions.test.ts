import { describe, expect, it } from "vitest";
import {
  computeSummary,
  filterByDateRange,
  getCategorySpending,
  getDailyTotals,
  getWeeklyTotalsForMonth,
  groupTransactions,
} from "./transactions";
import type { Transaction } from "./types";

const txs: Transaction[] = [
  {
    id: "1",
    date: "2026-04-01",
    description: "A",
    amount: -100000,
    category: "Dining",
    bank: "bca",
    sourceFile: "f.pdf",
  },
  {
    id: "2",
    date: "2026-04-15",
    description: "B",
    amount: -200000,
    category: "Transport",
    bank: "bca",
    sourceFile: "f.pdf",
  },
  {
    id: "3",
    date: "2026-05-01",
    description: "C",
    amount: -50000,
    category: "Dining",
    bank: "mandiri",
    sourceFile: "g.pdf",
  },
  {
    id: "4",
    date: "2026-05-10",
    description: "D",
    amount: 500000,
    category: "Other",
    bank: "bca",
    sourceFile: "g.pdf",
  }, // credit
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
    const apr = groups.find((g) => g.label === "Apr 2026");
    expect(apr).toBeDefined();
    expect(apr?.total).toBe(300000);
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
    const dining = result.find((c) => c.category === "Dining");
    expect(dining).toBeDefined();
    expect(dining?.total).toBe(150000);
  });

  it("excludes credits (positive amounts)", () => {
    const result = getCategorySpending(txs);
    const other = result.find((c) => c.category === "Other");
    expect(other).toBeUndefined();
  });
});

describe("getDailyTotals", () => {
  it("returns daily expense totals for the given month", () => {
    const result = getDailyTotals(txs, "2026-04");
    expect(result["2026-04-01"]).toBe(100000);
    expect(result["2026-04-15"]).toBe(200000);
    expect(result["2026-05-01"]).toBeUndefined();
  });

  it("excludes credits (positive amounts)", () => {
    const result = getDailyTotals(txs, "2026-05");
    expect(result["2026-05-10"]).toBeUndefined();
    expect(result["2026-05-01"]).toBe(50000);
  });

  it("returns empty object for month with no transactions", () => {
    expect(getDailyTotals(txs, "2025-01")).toEqual({});
  });

  it("sums multiple transactions on the same day", () => {
    const multi: Transaction[] = [
      {
        id: "a",
        date: "2026-06-01",
        description: "X",
        amount: -10000,
        category: "Food",
        bank: "bca",
        sourceFile: "x.pdf",
      },
      {
        id: "b",
        date: "2026-06-01",
        description: "Y",
        amount: -20000,
        category: "Food",
        bank: "bca",
        sourceFile: "x.pdf",
      },
    ];
    const result = getDailyTotals(multi, "2026-06");
    expect(result["2026-06-01"]).toBe(30000);
  });
});

describe("getWeeklyTotalsForMonth", () => {
  // April 2026 starts on Wednesday (Mon=0 → dow=2)
  // Row 0: Mon Mar 30, Tue Mar 31, Wed Apr 1(100k), Thu Apr 2, Fri Apr 3, Sat Apr 4, Sun Apr 5
  // Row 1: Apr 6–12 → 0
  // Row 2: Apr 13–19 → Apr 15(200k)
  // Row 3: Apr 20–26 → 0
  // Row 4: Apr 27–30 → 0

  it("returns correct weekly totals per calendar row", () => {
    const result = getWeeklyTotalsForMonth(txs, "2026-04");
    expect(result[0]).toBe(100000); // Apr 1
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(200000); // Apr 15
    expect(result[3]).toBe(0);
    expect(result[4]).toBe(0); // Apr 27–30 partial week
  });

  it("excludes overflow days from adjacent months", () => {
    const result = getWeeklyTotalsForMonth(txs, "2026-04");
    const total = result.reduce((s: number, n: number) => s + n, 0);
    expect(total).toBe(300000); // only Apr transactions (100k + 200k)
  });

  it("returns correct number of rows for the month", () => {
    const result = getWeeklyTotalsForMonth(txs, "2026-04");
    expect(result.length).toBe(5); // April 2026 needs 5 rows
  });

  it("returns all-zero rows for month with no transactions", () => {
    const result = getWeeklyTotalsForMonth(txs, "2025-01");
    expect(result.every((n: number) => n === 0)).toBe(true);
    expect(result.length).toBe(5); // Jan 2025 starts Wednesday → 5 rows
  });
});
