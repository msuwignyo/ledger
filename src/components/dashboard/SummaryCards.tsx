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
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <Label>Total Spent</Label>
        <Value accent>{formatIDR(totalExpense)}</Value>
      </Card>
      <Card>
        <Label>Transactions</Label>
        <Value>{transactionCount}</Value>
      </Card>
      <Card>
        <Label>Top Category</Label>
        <Value>{topCategory}</Value>
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#111722",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-widest mb-2 font-medium"
      style={{ color: "#444A6A" }}
    >
      {children}
    </p>
  );
}

function Value({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <p
      className="text-2xl font-bold leading-none font-mono"
      style={{ color: accent ? "#F5A623" : "#E4E8F5" }}
    >
      {children}
    </p>
  );
}
