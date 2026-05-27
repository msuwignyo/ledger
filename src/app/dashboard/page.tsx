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

const PANEL_STYLE = {
  background: "#111722",
  border: "1px solid rgba(255,255,255,0.07)",
};

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
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "#E4E8F5" }}>
          Overview
        </h1>
        <PeriodToggle value={period} onChangeAction={setPeriod} />
      </div>

      <SummaryCards transactions={transactions} />

      <div className="flex gap-4">
        <div className="flex-[2] rounded-xl p-5" style={PANEL_STYLE}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium" style={{ color: "#5C6280" }}>
              Spending Over Time
            </h2>
            <div
              className="flex gap-0.5 p-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {(["bar", "frequency"] as ChartType[]).map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setChartType(ct)}
                  className="px-3 py-1 rounded text-xs font-medium capitalize transition-all"
                  style={
                    chartType === ct
                      ? {
                          background: "rgba(255,255,255,0.10)",
                          color: "#E4E8F5",
                        }
                      : { color: "rgba(228,232,245,0.35)" }
                  }
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>
          {chartType === "bar" ? (
            <SpendingBarChart data={grouped} period={period} />
          ) : (
            <FrequencyChart transactions={transactions} period={period} />
          )}
        </div>

        <div className="flex-1 rounded-xl p-5" style={PANEL_STYLE}>
          <h2 className="text-sm font-medium mb-5" style={{ color: "#5C6280" }}>
            By Category
          </h2>
          <CategoryPieChart data={categorySpending} />
        </div>
      </div>
    </div>
  );
}
