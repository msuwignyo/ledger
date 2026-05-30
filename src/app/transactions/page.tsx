"use client";

import { useEffect, useRef, useState } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { getActiveTransactions, getTransactions, saveTransactions } from "@/lib/storage";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [visibleTransactions, setVisibleTransactions] = useState<Transaction[]>([]);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    setAllTransactions(getTransactions());
    setVisibleTransactions(getActiveTransactions());
    function refresh() {
      setAllTransactions(getTransactions());
      setVisibleTransactions(getActiveTransactions());
    }
    window.addEventListener("ledger:updated", refresh);
    return () => window.removeEventListener("ledger:updated", refresh);
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveTransactions(allTransactions);
  }, [allTransactions]);

  function handleCategoryChange(id: string, category: string) {
    setAllTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category } : tx)),
    );
    setVisibleTransactions((prev) =>
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
        transactions={visibleTransactions}
        onCategoryChangeAction={handleCategoryChange}
      />
    </div>
  );
}
