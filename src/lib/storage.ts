import type { Transaction } from "./types";

const KEYS = {
  transactions: "ledger:transactions",
  categories: "ledger:categories",
} as const;

const DEFAULT_CATEGORIES = [
  "Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Health",
  "Entertainment",
  "Travel",
  "Other",
];

export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.transactions);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
}

export function getCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(KEYS.categories);
    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: string[]): void {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}
