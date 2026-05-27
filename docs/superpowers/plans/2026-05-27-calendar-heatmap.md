# Calendar Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-width calendar heatmap as the monthly view on the dashboard, where circles on each day cell represent daily spending and amber bars on the left represent weekly totals.

**Architecture:** Two new helper functions (`getDailyTotals`, `getWeeklyTotalsForMonth`) are added to `src/lib/transactions.ts` to compute per-day and per-row spending. A new `CalendarHeatmap` React component uses D3 only for scale calculations (no SVG/DOM manipulation), rendering pure React divs. The dashboard page conditionally renders either the calendar (monthly) or the existing bar/pie layout (weekly/daily).

**Tech Stack:** React 19 (React Compiler, `"use client"`), D3 v7 (scales only), TypeScript, Biome linting (2-space indent, function props on client components must end with `Action` suffix — Rule 71007), vitest for tests.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/transactions.ts` | Modify | Add `getDailyTotals` and `getWeeklyTotalsForMonth` |
| `src/lib/transactions.test.ts` | Modify | Tests for both new helpers |
| `src/components/dashboard/CalendarHeatmap.tsx` | Create | The calendar grid component |
| `src/app/dashboard/page.tsx` | Modify | Conditional monthly render + compactness pass |
| `src/components/dashboard/SummaryCards.tsx` | Modify | Compactness: reduce card padding |

---

## Task 1: Add `getDailyTotals` helper

**Files:**
- Modify: `src/lib/transactions.ts`
- Modify: `src/lib/transactions.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/lib/transactions.test.ts`. Add this import and test suite at the end of the file:

```ts
import {
  computeSummary,
  filterByDateRange,
  getCategorySpending,
  getDailyTotals,
  groupTransactions,
} from "./transactions";
```

And append at the bottom:

```ts
describe("getDailyTotals", () => {
  it("returns daily expense totals for the given month", () => {
    const result = getDailyTotals(txs, "2026-04");
    expect(result["2026-04-01"]).toBe(100000);
    expect(result["2026-04-15"]).toBe(200000);
    expect(result["2026-05-01"]).toBeUndefined();
  });

  it("excludes credits (positive amounts)", () => {
    const result = getDailyTotals(txs, "2026-05");
    expect(result["2026-05-10"]).toBeUndefined();
    expect(result["2026-05-01"]).toBe(50000);
  });

  it("returns empty object for month with no transactions", () => {
    expect(getDailyTotals(txs, "2025-01")).toEqual({});
  });

  it("sums multiple transactions on the same day", () => {
    const multi: Transaction[] = [
      { id: "a", date: "2026-06-01", description: "X", amount: -10000, category: "Food", bank: "bca", sourceFile: "x.pdf" },
      { id: "b", date: "2026-06-01", description: "Y", amount: -20000, category: "Food", bank: "bca", sourceFile: "x.pdf" },
    ];
    const result = getDailyTotals(multi, "2026-06");
    expect(result["2026-06-01"]).toBe(30000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npx vitest run src/lib/transactions.test.ts
```

Expected: FAIL — `getDailyTotals is not a function` (or similar import error)

- [ ] **Step 3: Implement `getDailyTotals` in `src/lib/transactions.ts`**

Add this export after `getCategorySpending`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npx vitest run src/lib/transactions.test.ts
```

Expected: All tests pass, including the new `getDailyTotals` suite.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transactions.ts src/lib/transactions.test.ts
git commit -m "feat: add getDailyTotals helper"
```

---

## Task 2: Add `getWeeklyTotalsForMonth` helper

The calendar grid always starts on Monday. A "week row" is a 7-day block starting Monday. Overflow days (adjacent month) contribute 0 to weekly totals.

**Files:**
- Modify: `src/lib/transactions.ts`
- Modify: `src/lib/transactions.test.ts`

- [ ] **Step 1: Write the failing tests**

Update the import in `src/lib/transactions.test.ts`:

```ts
import {
  computeSummary,
  filterByDateRange,
  getCategorySpending,
  getDailyTotals,
  getWeeklyTotalsForMonth,
  groupTransactions,
} from "./transactions";
```

Append at the bottom of `src/lib/transactions.test.ts`:

```ts
describe("getWeeklyTotalsForMonth", () => {
  // April 2026 starts on Wednesday (Mon=0 → dow=2)
  // Row 0: Mon Mar 30, Tue Mar 31, Wed Apr 1(100k), Thu Apr 2, Fri Apr 3, Sat Apr 4, Sun Apr 5
  // Row 1: Apr 6–12 → 0
  // Row 2: Apr 13–19 → Apr 15(200k)
  // Row 3: Apr 20–26 → 0
  // Row 4: Apr 27–30 → 0

  it("returns correct weekly totals per calendar row", () => {
    const result = getWeeklyTotalsForMonth(txs, "2026-04");
    expect(result[0]).toBe(100000); // Apr 1
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(200000); // Apr 15
    expect(result[3]).toBe(0);
  });

  it("excludes overflow days from adjacent months", () => {
    const result = getWeeklyTotalsForMonth(txs, "2026-04");
    const total = result.reduce((s, n) => s + n, 0);
    expect(total).toBe(300000); // only Apr transactions (100k + 200k)
  });

  it("returns correct number of rows for the month", () => {
    const result = getWeeklyTotalsForMonth(txs, "2026-04");
    expect(result.length).toBe(5); // April 2026 needs 5 rows
  });

  it("returns all-zero rows for month with no transactions", () => {
    const result = getWeeklyTotalsForMonth(txs, "2025-01");
    expect(result.every((n) => n === 0)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npx vitest run src/lib/transactions.test.ts
```

Expected: FAIL — `getWeeklyTotalsForMonth is not a function`

- [ ] **Step 3: Implement `getWeeklyTotalsForMonth` in `src/lib/transactions.ts`**

Add this export after `getDailyTotals`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npx vitest run src/lib/transactions.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transactions.ts src/lib/transactions.test.ts
git commit -m "feat: add getWeeklyTotalsForMonth helper"
```

---

## Task 3: Build `CalendarHeatmap` component

**Files:**
- Create: `src/components/dashboard/CalendarHeatmap.tsx`

No unit tests for this component — visual correctness is validated by running the app. Biome lint will catch style issues.

- [ ] **Step 1: Create the file**

Create `src/components/dashboard/CalendarHeatmap.tsx` with the full component:

```tsx
"use client";

import * as d3 from "d3";
import { useMemo, useState } from "react";
import { getDailyTotals, getWeeklyTotalsForMonth } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function formatAmountShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
  return String(Math.round(amount));
}

function formatMonthTotal(amount: number): string {
  if (amount === 0) return "Rp 0";
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${Math.round(amount / 1_000)}rb`;
  return `Rp ${amount}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: -1 | 1): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

type CalendarCell = { date: string; dayNum: number } | null;

function buildCalendarRows(month: string): CalendarCell[][] {
  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const dow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const numWeeks = Math.ceil((dow + daysInMonth) / 7);

  return Array.from({ length: numWeeks }, (_, w) =>
    Array.from({ length: 7 }, (__, d) => {
      const dayNum = w * 7 + d - dow + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      return {
        date: `${month}-${String(dayNum).padStart(2, "0")}`,
        dayNum,
      };
    }),
  );
}

const TODAY = new Date().toISOString().slice(0, 10);

export function CalendarHeatmap({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [month, setMonth] = useState(getCurrentMonth);

  const dailyTotals = useMemo(
    () => getDailyTotals(transactions, month),
    [transactions, month],
  );
  const weeklyTotals = useMemo(
    () => getWeeklyTotalsForMonth(transactions, month),
    [transactions, month],
  );

  const maxDaily = Math.max(...Object.values(dailyTotals), 0);
  const maxWeekly = Math.max(...weeklyTotals, 0);
  const monthTotal = Object.values(dailyTotals).reduce((s, n) => s + n, 0);

  const circleScale = d3.scaleSqrt().domain([0, maxDaily || 1]).range([4, 28]);
  const barScale = d3.scaleLinear().domain([0, maxWeekly || 1]).range([4, 52]);

  const rows = useMemo(() => buildCalendarRows(month), [month]);

  return (
    <div
      style={{
        maxWidth: 780,
        width: "100%",
        background: "#111722",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "#9AA0BE",
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#E4E8F5" }}>
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "#9AA0BE",
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>
        <span
          style={{
            fontSize: 12,
            color: "#5C6280",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {formatMonthTotal(monthTotal)}
        </span>
      </div>

      {/* Day-of-week headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "40px repeat(7, 1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        <div />
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#3D4465",
              fontWeight: 600,
              letterSpacing: "0.08em",
              padding: "4px 0",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((row, wi) => {
          const weekTotal = weeklyTotals[wi] ?? 0;
          const barHeight = weekTotal > 0 ? barScale(weekTotal) : 0;
          return (
            <div
              key={wi}
              style={{
                display: "grid",
                gridTemplateColumns: "40px repeat(7, 1fr)",
                gap: 2,
                alignItems: "center",
              }}
            >
              {/* Week bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 6,
                  height: 56,
                }}
              >
                {barHeight > 0 && (
                  <div
                    style={{
                      background: "rgba(245,166,35,0.25)",
                      border: "1px solid rgba(245,166,35,0.4)",
                      borderRadius: 4,
                      width: 12,
                      height: barHeight,
                    }}
                  />
                )}
              </div>

              {/* Day cells */}
              {row.map((cell, di) => {
                if (!cell) {
                  return (
                    <div
                      key={di}
                      style={{ height: 56, background: "transparent" }}
                    />
                  );
                }
                const isToday = cell.date === TODAY;
                const amount = dailyTotals[cell.date] ?? 0;
                const radius = amount > 0 ? circleScale(amount) : 0;

                return (
                  <div
                    key={cell.date}
                    style={{
                      height: 56,
                      borderRadius: 8,
                      background: isToday
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.025)",
                      outline: isToday
                        ? "1px solid rgba(255,255,255,0.1)"
                        : undefined,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      padding: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: isToday ? "#E4E8F5" : "#5C6280",
                        fontWeight: 500,
                        lineHeight: 1,
                        alignSelf: "flex-start",
                        paddingLeft: 3,
                        width: "100%",
                      }}
                    >
                      {cell.dayNum}
                    </div>
                    {amount > 0 && (
                      <>
                        <div
                          style={{
                            borderRadius: "50%",
                            background: "rgba(78,130,247,0.35)",
                            border: "1.5px solid rgba(78,130,247,0.7)",
                            width: radius * 2,
                            height: radius * 2,
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 8,
                            fontFamily: "var(--font-mono, monospace)",
                            color: "#5C6280",
                            lineHeight: 1,
                          }}
                        >
                          {formatAmountShort(amount)}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "#5C6280",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "rgba(78,130,247,0.35)",
              border: "1.5px solid rgba(78,130,247,0.7)",
              flexShrink: 0,
            }}
          />
          Circle size = daily spending
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "#5C6280",
          }}
        >
          <div
            style={{
              width: 10,
              height: 18,
              background: "rgba(245,166,35,0.25)",
              border: "1px solid rgba(245,166,35,0.4)",
              borderRadius: 3,
              flexShrink: 0,
            }}
          />
          Bar height = weekly total
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run Biome to check for lint errors**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npx biome check src/components/dashboard/CalendarHeatmap.tsx
```

Expected: No errors. If there are formatting issues, run:
```bash
npx biome check --write src/components/dashboard/CalendarHeatmap.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/CalendarHeatmap.tsx
git commit -m "feat: add CalendarHeatmap component"
```

---

## Task 4: Wire up dashboard + compactness pass

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/dashboard/SummaryCards.tsx`

- [ ] **Step 1: Update `src/app/dashboard/page.tsx`**

Replace the entire file content with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { CalendarHeatmap } from "@/components/dashboard/CalendarHeatmap";
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
    <div className="flex flex-col gap-3 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "#F0F2FA" }}>
          Overview
        </h1>
        <PeriodToggle value={period} onChangeAction={setPeriod} />
      </div>

      <SummaryCards transactions={transactions} />

      {period === "monthly" ? (
        <CalendarHeatmap transactions={transactions} />
      ) : (
        <div className="flex gap-4">
          <div className="flex-[2] rounded-xl p-4" style={PANEL_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-medium"
                style={{ color: "#5C6280" }}
              >
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

          <div className="flex-1 rounded-xl p-4" style={PANEL_STYLE}>
            <h2
              className="text-sm font-medium mb-4"
              style={{ color: "#5C6280" }}
            >
              By Category
            </h2>
            <CategoryPieChart data={categorySpending} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/dashboard/SummaryCards.tsx`**

Change the `Card` component's padding from `p-5` to `py-3 px-4`:

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl py-3 px-4"
      style={{
        background: "#111722",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Run Biome on modified files**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npx biome check src/app/dashboard/page.tsx src/components/dashboard/SummaryCards.tsx
```

If formatting issues:
```bash
npx biome check --write src/app/dashboard/page.tsx src/components/dashboard/SummaryCards.tsx
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/dashboard/SummaryCards.tsx
git commit -m "feat: wire up calendar heatmap as monthly dashboard view"
```

---

## Task 5: Final build check

- [ ] **Step 1: Run the dev server and verify visually**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npm run dev
```

Open `http://localhost:3000/dashboard` and verify:
- Monthly view: full-width calendar with circles and week bars visible (if transactions exist)
- Navigating months with ‹ › works
- Switching to Weekly or Daily shows the original bar/frequency + pie layout
- No console errors

- [ ] **Step 2: Run production build to catch type errors**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address build issues from calendar heatmap"
```
