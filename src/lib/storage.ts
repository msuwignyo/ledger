import type { Transaction } from "./types";

const KEYS = {
  transactions: "ledger:transactions",
  categories: "ledger:categories",
  disabledSources: "ledger:disabled-sources",
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

export function getDisabledSources(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEYS.disabledSources);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDisabledSources(disabled: Set<string>): void {
  localStorage.setItem(KEYS.disabledSources, JSON.stringify([...disabled]));
}

export function getActiveTransactions(): Transaction[] {
  const all = getTransactions();
  const disabled = getDisabledSources();
  return disabled.size === 0 ? all : all.filter((tx) => !disabled.has(tx.sourceFile));
}

export function deleteSource(sourceFile: string): void {
  saveTransactions(getTransactions().filter((tx) => tx.sourceFile !== sourceFile));
  const disabled = getDisabledSources();
  disabled.delete(sourceFile);
  saveDisabledSources(disabled);
}
