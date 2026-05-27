export type BankName = "mandiri" | "bca" | "cimb" | "smbc";

export type Period = "monthly" | "weekly" | "daily";

export type ChartType = "bar" | "frequency";

export type Transaction = {
  id: string;
  date: string; // ISO 8601, e.g. "2026-04-15"
  description: string;
  amount: number; // negative = expense, positive = credit/refund
  category: string;
  bank: BankName;
  sourceFile: string;
};

export type GroupedSpending = {
  label: string; // e.g. "Apr 2026", "Week 14", "2026-04-15"
  total: number;
  count: number;
};

export type CategorySpending = {
  category: string;
  total: number;
  count: number;
};
