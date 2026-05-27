import type {
  CategorySpending,
  GroupedSpending,
  Period,
  Transaction,
} from "./types";

export function groupTransactions(
  transactions: Transaction[],
  period: Period,
): GroupedSpending[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const label = getPeriodLabel(tx.date, period);
    const entry = map.get(label) ?? { total: 0, count: 0 };
    if (tx.amount < 0) entry.total += Math.abs(tx.amount);
    entry.count += 1;
    map.set(label, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, { total, count }]) => ({ label, total, count }));
}

function getPeriodLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "monthly") {
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  }
  if (period === "weekly") {
    const weekNum = String(getISOWeek(d)).padStart(2, "0");
    return `${d.getFullYear()}-W${weekNum}`;
  }
  // daily
  return dateStr;
}

function getISOWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

export function filterByDateRange(
  transactions: Transaction[],
  start: string | null,
  end: string | null,
): Transaction[] {
  return transactions.filter((tx) => {
    if (start && tx.date < start) return false;
    if (end && tx.date > end) return false;
    return true;
  });
}

export function computeSummary(transactions: Transaction[]): {
  totalExpense: number;
  transactionCount: number;
  topCategory: string;
} {
  const expenses = transactions.filter((tx) => tx.amount < 0);
  const totalExpense = expenses.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0,
  );
  const categoryCounts = new Map<string, number>();
  for (const tx of expenses) {
    categoryCounts.set(tx.category, (categoryCounts.get(tx.category) ?? 0) + 1);
  }
  let topCategory = "—";
  let maxCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  }
  return { totalExpense, transactionCount: transactions.length, topCategory };
}

export function getCategorySpending(
  transactions: Transaction[],
): CategorySpending[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // skip credits
    const entry = map.get(tx.category) ?? { total: 0, count: 0 };
    entry.total += Math.abs(tx.amount);
    entry.count += 1;
    map.set(tx.category, entry);
  }
  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);
}
