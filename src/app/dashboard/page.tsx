"use client";

import { useEffect, useState } from "react";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FrequencyChart } from "@/components/dashboard/FrequencyChart";
import { PeriodToggle } from "@/components/dashboard/PeriodToggle";
import { SpendingBarChart } from "@/components/dashboard/SpendingBarChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { getTransactions } from "@/lib/storage";
import { getCategorySpending, groupTransactions } from "@/lib/transactions";
import type { ChartType, Period, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());

    function refresh() {
      setTransactions(getTransactions());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("ledger:updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ledger:updated", refresh);
    };
  }, []);

  const grouped = groupTransactions(transactions, period);
  const categorySpending = getCategorySpending(transactions);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
        <PeriodToggle value={period} onChangeAction={setPeriod} />
      </div>

      <SummaryCards transactions={transactions} />

      <div className="flex gap-4">
        <div className="flex-[2] bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700">
              Spending Over Time
            </h2>
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-full">
              {(["bar", "frequency"] as ChartType[]).map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setChartType(ct)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    chartType === ct
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>
          {chartType === "bar" ? (
            <SpendingBarChart data={grouped} />
          ) : (
            <FrequencyChart transactions={transactions} />
          )}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">
            By Category
          </h2>
          <CategoryPieChart data={categorySpending} />
        </div>
      </div>
    </div>
  );
}
