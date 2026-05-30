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

export function getDailyTotals(
  transactions: Transaction[],
  month: string,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    if (!tx.date.startsWith(month)) continue;
    result[tx.date] = (result[tx.date] ?? 0) + Math.abs(tx.amount);
  }
  return result;
}

export function getWeeklyTotalsForMonth(
  transactions: Transaction[],
  month: string,
): number[] {
  const dailyTotals = getDailyTotals(transactions, month);
  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const dow = (firstDay.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const numWeeks = Math.ceil((dow + daysInMonth) / 7);

  return Array.from({ length: numWeeks }, (_, w) => {
    let weekTotal = 0;
    for (let d = 0; d < 7; d++) {
      const dayNum = w * 7 + d - dow + 1;
      if (dayNum < 1 || dayNum > daysInMonth) continue;
      const dateStr = `${month}-${String(dayNum).padStart(2, "0")}`;
      weekTotal += dailyTotals[dateStr] ?? 0;
    }
    return weekTotal;
  });
}
