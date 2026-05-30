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

type CalendarCell = { date: string; dayNum: number; inMonth: boolean };

function buildCalendarRows(month: string): CalendarCell[][] {
  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const dow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const numWeeks = Math.ceil((dow + daysInMonth) / 7);

  return Array.from({ length: numWeeks }, (_, w) =>
    Array.from({ length: 7 }, (__, d) => {
      const dayNum = w * 7 + d - dow + 1;
      const cellDate = new Date(year, monthNum - 1, dayNum);
      const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
      return {
        date: dateStr,
        dayNum: cellDate.getDate(),
        inMonth: dayNum >= 1 && dayNum <= daysInMonth,
      };
    }),
  );
}

export function CalendarHeatmap({ transactions }: { transactions: Transaction[] }) {
  const [month, setMonth] = useState(getCurrentMonth);

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const dailyTotals = useMemo(
    () => getDailyTotals(transactions, month),
    [transactions, month],
  );
  const weeklyTotals = useMemo(
    () => getWeeklyTotalsForMonth(transactions, month),
    [transactions, month],
  );

  const { monthTotal, circleScale, barScale } = useMemo(() => {
    const maxDaily = Math.max(...Object.values(dailyTotals), 0);
    const maxWeekly = Math.max(...weeklyTotals, 0);
    return {
      monthTotal: Object.values(dailyTotals).reduce((s, n) => s + n, 0),
      circleScale: d3.scaleSqrt().domain([0, maxDaily || 1]).range([4, 28]),
      barScale: d3.scaleLinear().domain([0, maxWeekly || 1]).range([6, 62]),
    };
  }, [dailyTotals, weeklyTotals]);

  const rows = useMemo(() => buildCalendarRows(month), [month]);

  return (
    <div className="panel" style={{ maxWidth: 820 }}>
      <div className="cal__head">
        <div className="cal__nav">
          <button
            type="button"
            className="cal__arrow"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="cal__month">{formatMonthLabel(month)}</span>
          <button
            type="button"
            className="cal__arrow"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <span className="cal__total">
          spent this month&nbsp;&nbsp;<b>{formatMonthTotal(monthTotal)}</b>
        </span>
      </div>

      <div className="cal__dow">
        <span />
        {DAY_HEADERS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {rows.map((row, weekIdx) => {
        const firstInMonth = row.find((c) => c.inMonth);
        const weekKey = firstInMonth ? firstInMonth.date : `w${weekIdx}`;
        const weekTotal = weeklyTotals[weekIdx] ?? 0;
        const barHeight = weekTotal > 0 ? barScale(weekTotal) : 0;

        return (
          <div className="cal__row" key={weekKey}>
            <div className="cal__week">
              {barHeight > 0 && (
                <div
                  className="cal__weekbar"
                  style={{ height: barHeight }}
                  title={formatMonthTotal(weekTotal)}
                />
              )}
            </div>
            {row.map((cell) => {
              if (!cell.inMonth) {
                return <div className="cal__cell out" key={cell.date} />;
              }
              const isToday = cell.date === today;
              const amount = dailyTotals[cell.date] ?? 0;
              const radius = amount > 0 ? circleScale(amount) : 0;

              return (
                <div
                  className={`cal__cell${isToday ? " today" : ""}`}
                  key={cell.date}
                >
                  <span className="cal__daynum">{cell.dayNum}</span>
                  {amount > 0 && (
                    <>
                      <div
                        className="cal__dot"
                        style={{ width: radius * 2, height: radius * 2 }}
                      />
                      <div className="cal__amt">{formatAmountShort(amount)}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="cal__legend">
        <span>
          <svg width="16" height="16">
            <circle cx="8" cy="8" r="6" fill="rgba(139,44,29,0.16)" stroke="#8b2c1d" strokeWidth="1.4" />
          </svg>
          ring grows with the day's spending
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 16,
              background: "#8b2c1d",
              opacity: 0.85,
              borderRadius: 1,
            }}
          />
          margin bar marks the week's total
        </span>
      </div>
    </div>
  );
}
