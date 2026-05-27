import { describe, it, expect } from "vitest";
import { deduplicateTransactions } from "./dedup";
import type { Transaction } from "./types";

const existing: Transaction[] = [
  {
    id: "1",
    date: "2026-04-15",
    description: "Grab",
    amount: -23000,
    category: "Transport",
    bank: "bca",
    sourceFile: "april.pdf",
  },
];

const incoming: Transaction[] = [
  // duplicate — same date, description, amount
  {
    id: "2",
    date: "2026-04-15",
    description: "Grab",
    amount: -23000,
    category: "Transport",
    bank: "bca",
    sourceFile: "april.pdf",
  },
  // new transaction
  {
    id: "3",
    date: "2026-04-16",
    description: "Indomaret",
    amount: -45000,
    category: "Groceries",
    bank: "bca",
    sourceFile: "april.pdf",
  },
];

describe("deduplicateTransactions", () => {
  it("filters out transactions that already exist", () => {
    const result = deduplicateTransactions(existing, incoming);
    expect(result.newTransactions).toHaveLength(1);
    expect(result.newTransactions[0].description).toBe("Indomaret");
  });

  it("reports correct duplicate count", () => {
    const result = deduplicateTransactions(existing, incoming);
    expect(result.duplicateCount).toBe(1);
  });

  it("returns all when no duplicates", () => {
    const result = deduplicateTransactions([], incoming);
    expect(result.newTransactions).toHaveLength(2);
    expect(result.duplicateCount).toBe(0);
  });
});
