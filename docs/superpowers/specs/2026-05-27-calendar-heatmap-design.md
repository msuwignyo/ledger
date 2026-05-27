# Calendar Heatmap View — Design Spec

## Overview

Add a calendar heatmap as the primary monthly view in the Ledger dashboard. When the period toggle is set to "Monthly", the existing bar/frequency+pie layout is replaced by a full-width calendar grid. Weekly and daily periods are unaffected.

---

## Architecture

**Dashboard page (`src/app/dashboard/page.tsx`):**
- When `period === "monthly"`: render `<CalendarHeatmap transactions={transactions} />` spanning the full width, hiding the pie chart
- When `period !== "monthly"`: render the existing 2-column layout unchanged

**New helpers in `src/lib/transactions.ts`:**
- `getDailyTotals(transactions: Transaction[], month: string): Record<string, number>`
  - `month` is `"YYYY-MM"`
  - Returns a map of `"YYYY-MM-DD"` → sum of absolute spending amounts for that day
  - Only counts negative transactions (debits/spending), ignores credits
- `getWeeklyTotalsForMonth(transactions: Transaction[], month: string): number[]`
  - Returns an array of weekly totals (one per calendar row) for the given month
  - A "week row" is defined by which calendar row the days fall in (not ISO week)
  - Only counts days within the target month (overflow days from adjacent months = 0)

**New component: `src/components/dashboard/CalendarHeatmap.tsx`:**
- Props: `{ transactions: Transaction[] }`
- Internal state: `month: string` (defaults to current `"YYYY-MM"`, navigable via prev/next)
- D3 scales (computed, not used for DOM): `scaleSqrt` for circle radius, `scaleLinear` for week bar height
- Pure React rendering — no `svgRef`/`useEffect` D3 DOM pattern

---

## Visual Design

### Layout Grid
- Outer wrapper: max-width `780px`, dark surface `#111722`, `1px solid rgba(255,255,255,0.07)` border, `16px` border-radius, `16px` padding
- Grid columns: `40px` (week bar column) + `repeat(7, 1fr)` (Mon–Sun)
- Row gap: `2px`

### Header
- Left: `‹` / `›` nav buttons + month name (e.g. "May 2026"), font-size `15px`, weight `600`, color `#E4E8F5`
- Right: month total in Rp format (abbreviated: `Rp 10.4jt`), `font-mono`, color `#5C6280`
- Day-of-week headers: MON–SUN, `10px`, uppercase, `#3D4465`, letter-spacing `0.08em`

### Day Cells
- Height: `56px`, border-radius `8px`
- Default background: `rgba(255,255,255,0.025)`
- Today: `rgba(255,255,255,0.05)` + `outline: 1px solid rgba(255,255,255,0.1)`
- Days outside the current month (overflow): `transparent` background, no content
- Day number: `10px`, color `#5C6280` (today: `#E4E8F5`), top-left aligned

### Spending Circle
- Only rendered when daily total > 0
- Radius: D3 `scaleSqrt` — domain `[0, maxDailyTotal]`, range `[4, 28]` (px)
- Color: `rgba(78,130,247,0.35)` fill, `1.5px solid rgba(78,130,247,0.7)` border
- Centered in cell below day number
- Amount label: `8px`, `font-mono`, `#5C6280`, abbreviated (e.g. `285rb`, `1.4jt`)

### Week Bars (left column)
- Width: `12px`, border-radius `4px`
- Color: `rgba(245,166,35,0.25)` fill, `1px solid rgba(245,166,35,0.4)` border
- Height: linear scale — domain `[0, maxWeeklyTotal]`, range `[4, 52]` (px)
- Hidden (height 0) for weeks with no spending

### Legend
- Bottom of card, separated by `1px solid rgba(255,255,255,0.05)` divider
- Circle swatch + "Circle size = daily spending"
- Amber rect swatch + "Bar height = weekly total"

---

## Amount Formatting

Abbreviated IDR format used throughout:
- `< 1,000`: show as-is (rare edge case)
- `1,000–999,999`: `Xrb` (e.g. `285rb`)
- `≥ 1,000,000`: `X.Xjt` (e.g. `1.4jt`)

This matches the existing convention in the mockup.

---

## Compactness Pass

Applied alongside the calendar work to tighten the overall dashboard layout:
- Dashboard `gap-5` → `gap-3` between sections
- Chart panel padding `p-5` → `p-4`
- Summary cards padding reduced slightly (`py-4 px-5` → `py-3 px-4`)

---

## Edge Cases

- **No spending on a day**: cell renders normally, no circle or label
- **Week row with no spending**: week bar absent (no empty bar rendered)
- **Overflow days** (adjacent month days visible in first/last row): empty cells, excluded from weekly totals
- **Empty month**: all cells without circles; header still shows month name and `Rp 0`
- **Calendar month navigation**: independent of the period toggle — navigating months in the calendar does not affect other dashboard state

---

## Out of Scope

- Clicking a day cell to drill into transactions (future feature)
- Showing income/credit amounts in the calendar
- Weekly/daily calendar views
