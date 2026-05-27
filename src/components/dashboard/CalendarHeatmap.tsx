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

export function CalendarHeatmap({
  transactions,
}: {
  transactions: Transaction[];
}) {
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
      circleScale: d3
        .scaleSqrt()
        .domain([0, maxDaily || 1])
        .range([4, 28]),
      barScale: d3
        .scaleLinear()
        .domain([0, maxWeekly || 1])
        .range([4, 52]),
    };
  }, [dailyTotals, weeklyTotals]);

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
        {rows.map((row, weekIdx) => {
          const firstInMonth = row.find((c) => c.inMonth);
          const weekKey = firstInMonth
            ? firstInMonth.date
            : `${month}-w${row[0].date}`;
          const weekTotal = weeklyTotals[weekIdx] ?? 0;
          const barHeight = weekTotal > 0 ? barScale(weekTotal) : 0;
          return (
            <div
              key={weekKey}
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
              {row.map((cell) => {
                if (!cell.inMonth) {
                  return (
                    <div
                      key={cell.date}
                      style={{ height: 56, background: "transparent" }}
                    />
                  );
                }
                const isToday = cell.date === today;
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
