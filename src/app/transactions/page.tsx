"use client";

import { useEffect, useState } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { getTransactions, saveTransactions } from "@/lib/storage";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  function handleCategoryChange(id: string, category: string) {
    const updated = transactions.map((tx) =>
      tx.id === id ? { ...tx, category } : tx,
    );
    setTransactions(updated);
    saveTransactions(updated);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-zinc-900">Transactions</h1>
      <TransactionTable
        transactions={transactions}
        onCategoryChangeAction={handleCategoryChange}
      />
    </div>
  );
}
