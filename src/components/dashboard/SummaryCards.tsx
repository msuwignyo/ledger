import { computeSummary } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

function formatIDR(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}

export function SummaryCards({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { totalExpense, transactionCount, topCategory } =
    computeSummary(transactions);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
          Total Spent
        </p>
        <p className="text-2xl font-bold text-zinc-900">
          {formatIDR(totalExpense)}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
          Transactions
        </p>
        <p className="text-2xl font-bold text-zinc-900">{transactionCount}</p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
          Top Category
        </p>
        <p className="text-2xl font-bold text-zinc-900">{topCategory}</p>
      </div>
    </div>
  );
}
