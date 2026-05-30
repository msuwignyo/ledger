"use client";

import { useEffect, useState } from "react";
import { CalendarHeatmap } from "@/components/dashboard/CalendarHeatmap";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FrequencyChart } from "@/components/dashboard/FrequencyChart";
import { PeriodToggle } from "@/components/dashboard/PeriodToggle";
import { SpendingBarChart } from "@/components/dashboard/SpendingBarChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { getActiveTransactions } from "@/lib/storage";
import { getCategorySpending, groupTransactions } from "@/lib/transactions";
import type { ChartType, Period, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getActiveTransactions());
    function refresh() {
      setTransactions(getActiveTransactions());
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
    <div className="page">
      <div className="chapter">
        <div>
          <div className="chapter__eyebrow">Chapter I · The Accounts</div>
          <h1 className="chapter__title">Overview</h1>
          <div className="chapter__sub">a reckoning of where the money went</div>
        </div>
        <PeriodToggle value={period} onChangeAction={setPeriod} />
      </div>
      <hr className="fleuron-rule" />

      <SummaryCards transactions={transactions} />

      <div style={{ height: 26 }} />

      {period === "monthly" ? (
        <CalendarHeatmap transactions={transactions} />
      ) : (
        <div className="grid-2">
          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Spending over time</h2>
              <div className="seg">
                {(["bar", "frequency"] as ChartType[]).map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    className={chartType === ct ? "on" : ""}
                    onClick={() => setChartType(ct)}
                  >
                    {ct === "bar" ? "Totals" : "Frequency"}
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
          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">By category</h2>
            </div>
            <CategoryPieChart data={categorySpending} />
          </div>
        </div>
      )}
    </div>
  );
}
