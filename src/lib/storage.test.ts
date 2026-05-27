import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

// Mock window object so typeof window !== "undefined"
vi.stubGlobal("window", {});

import {
  getCategories,
  getTransactions,
  saveCategories,
  saveTransactions,
} from "./storage";
import type { Transaction } from "./types";

const tx: Transaction = {
  id: "1",
  date: "2026-04-15",
  description: "Indomaret",
  amount: -45000,
  category: "Groceries",
  bank: "bca",
  sourceFile: "april.pdf",
};

describe("storage", () => {
  beforeEach(() => localStorageMock.clear());

  it("getTransactions returns [] when empty", () => {
    expect(getTransactions()).toEqual([]);
  });

  it("saveTransactions and getTransactions round-trip", () => {
    saveTransactions([tx]);
    expect(getTransactions()).toEqual([tx]);
  });

  it("getCategories returns defaults when empty", () => {
    const cats = getCategories();
    expect(cats).toContain("Dining");
    expect(cats).toContain("Other");
    expect(cats.length).toBeGreaterThan(0);
  });

  it("saveCategories and getCategories round-trip", () => {
    saveCategories(["Food", "Transport"]);
    expect(getCategories()).toEqual(["Food", "Transport"]);
  });
});
