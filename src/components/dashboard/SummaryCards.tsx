import { computeSummary } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const { totalExpense, transactionCount, topCategory } = computeSummary(transactions);
  const credits = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const net = credits - totalExpense;

  return (
    <div className="summary">
      <div className="summary__cell">
        <div className="summary__label">Total spent</div>
        <div className="summary__value accent">
          <span className="cur">Rp</span>
          {totalExpense.toLocaleString("id-ID")}
        </div>
        <div className="summary__meta">across {transactionCount} entries</div>
      </div>
      <div className="summary__cell">
        <div className="summary__label">Net position</div>
        <div className="summary__value">
          <span className="cur">Rp</span>
          {Math.abs(net).toLocaleString("id-ID")}
        </div>
        <div className="summary__meta">
          {net >= 0 ? "in the black" : "in the red"} after credits
        </div>
      </div>
      <div className="summary__cell">
        <div className="summary__label">Most frequent</div>
        <div className="summary__value name">
          {topCategory || "—"}
        </div>
        <div className="summary__meta">your busiest ledger line</div>
      </div>
    </div>
  );
}
