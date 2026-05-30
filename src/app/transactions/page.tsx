"use client";

import { useEffect, useRef, useState } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { getTransactions, saveTransactions } from "@/lib/storage";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    setTransactions(getTransactions());
    function refresh() {
      setTransactions(getTransactions());
    }
    window.addEventListener("ledger:updated", refresh);
    return () => window.removeEventListener("ledger:updated", refresh);
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveTransactions(transactions);
  }, [transactions]);

  function handleCategoryChange(id: string, category: string) {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category } : tx)),
    );
  }

  return (
    <div className="page">
      <div className="chapter">
        <div>
          <div className="chapter__eyebrow">Chapter II · The Day Book</div>
          <h1 className="chapter__title">Transactions</h1>
          <div className="chapter__sub">every entry, posted and dated</div>
        </div>
      </div>
      <hr className="fleuron-rule" />
      <TransactionTable
        transactions={transactions}
        onCategoryChangeAction={handleCategoryChange}
      />
    </div>
  );
}
