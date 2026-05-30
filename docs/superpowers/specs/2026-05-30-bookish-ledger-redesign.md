# Bookish Ledger Redesign

**Date:** 2026-05-30
**Source design:** `financial-visualizer/project/Ledger.html` (Claude Design handoff)

## Overview

Retheme the Ledger app from its current dark fintech aesthetic to a "bookish paper-and-ink" aesthetic. The metaphor: an actual accounting ledger book — cream paper, serif typography, oxblood red ink, ruled hairlines. Still reads as a modern app; not a costume.

## Design system

All tokens come from `bookish.css` (added to `src/app/`):

- **Paper**: `#f6f1e6` (page bg), `#ece4d2` (edge), `#e7decb` (shade/sidebar)
- **Ink**: `#1f1a14` (body), `#4a4036` (soft), `#8a7e6e` (faint)
- **Rules**: `#c9bfa9` (hairline), `#e3d9c4` (soft)
- **Accent**: `#8b2c1d` (oxblood), `#b0533f` (soft) — used very sparingly
- **Semantic**: `#4f6b3a` (moss/success for credits), `#a3711b` (ochre/warning)
- **Fonts**: EB Garamond (display headings), Lora (body), JetBrains Mono (code/labels)
- **Radius**: 0–6px only. Books don't have rounded corners.

## Section 1 — Foundations

**Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/app/bookish.css` (new), `src/app/app.css` (new)

- Copy `bookish.css` and `app.css` from the design bundle into `src/app/`
- `globals.css`: remove dark body styles; import the two new CSS files via `@import`
- `layout.tsx`: replace Geist fonts with `EB_Garamond` + `Lora` + `JetBrains_Mono` from `next/font/google`; add `bookish` class to `<body>`; change `<main>` to use `className="main"` (no padding — the `.page` inner div handles it); remove `bg-zinc-50`

## Section 2 — Sidebar

**File:** `src/components/layout/Sidebar.tsx`

Replace all dark styling with bookish classes from `app.css`:

- `<aside className="sidebar">` — `var(--paper-shade)` bg, `var(--rule)` right border
- Brand: "Ledger" in EB Garamond 30px + `<span className="stroke">.</span>` (oxblood dot), tagline "a book of accounts" in mono 10.5px uppercase faint
- `<div className="sidebar__rule" />` hairline divider
- Nav items: `.nav__item` class; active gets `.active` class (oxblood left bar + text)
- Upload button: `.btn-upload` class — `var(--stone-800)` bg, paper text, not amber
- Footer: "kept in a fair hand" in `.sidebar__sig` (italic, EB Garamond, faint)

## Section 3 — Dashboard page structure

**File:** `src/app/dashboard/page.tsx`

- Chapter header: eyebrow "Chapter I · The Accounts", `<h1>` "Overview", subtitle italic "a reckoning of where the money went"
- `<hr className="fleuron-rule" />` between header and content
- Period toggle wrapped in `.chapter` flex row (title left, toggle right)
- Panels: use `.panel` + `.panel__head` + `.panel__title` CSS classes instead of inline PANEL_STYLE
- Chart segmented control: `.seg` class instead of inline Tailwind

## Section 4 — SummaryCards → SummaryLedger

**File:** `src/components/dashboard/SummaryCards.tsx`

Replace 3 separate rounded cards with a single `.summary` grid:

```
<div className="summary">
  <div className="summary__cell">
    <div className="summary__label">Total spent</div>
    <div className="summary__value accent"><span className="cur">Rp</span>{amount}</div>
    <div className="summary__meta">across N entries</div>
  </div>
  ... (Net position, Most frequent)
</div>
```

- "Total spent" value: `var(--accent)` oxblood via `.accent` class
- "Net position": absolute value + "in the black"/"in the red" meta
- "Most frequent": category name at 30px EB Garamond
- Amount formatting: full IDR with `.toLocaleString("id-ID")`, not abbreviated

## Section 5 — CalendarHeatmap

**File:** `src/components/dashboard/CalendarHeatmap.tsx`

Drop the current inline-style-heavy approach; use bookish CSS classes from `app.css`:

- Container: `.panel` (max-width 820px)
- Header: `.cal__head` / `.cal__nav` / `.cal__arrow` / `.cal__month` / `.cal__total`
- DOW row: `.cal__dow` with 8 columns (`46px` gutter + 7 days)
- Each week row: `.cal__row` with `.cal__week` (week bar gutter) + 7 `.cal__cell` divs
- Out-of-month cells: `.cal__cell.out` (diagonal hatching via CSS background)
- Today cell: `.cal__cell.today` (inverted day number)
- Day number: `.cal__daynum`; circles: `.cal__dot` (oxblood, not blue); amount: `.cal__amt`
- Week bar: `.cal__weekbar` (oxblood, `var(--accent)`)
- Legend: `.cal__legend` with oxblood circle + bar examples
- Keep `d3.scaleSqrt` and `d3.scaleLinear` for radius/bar scaling
- `today` computed from real date (not hardcoded)

## Section 6 — Charts

**Files:** `src/components/dashboard/SpendingBarChart.tsx`, `src/components/dashboard/FrequencyChart.tsx`, `src/components/dashboard/CategoryPieChart.tsx`

Color token swaps only — logic unchanged:

| Component | Was | Becomes |
|---|---|---|
| BarChart bars | `#4E82F7` | `#8b2c1d` (oxblood) |
| BarChart gridlines | `rgba(255,255,255,0.05)` | `#e3d9c4` (rule-soft) |
| BarChart axis labels | `#3D4465` | `#8a7e6e` (ink-faint) |
| FrequencyChart line/dots | `#F5A623` | `#8b2c1d` |
| FrequencyChart gridlines | same as above | same as above |
| CategoryPieChart colors | vivid `[#4E82F7, #F5A623, ...]` | muted bookish `[#8b2c1d, #6f5b3e, #4f6b3a, #a3711b, #b0533f, #7c6a86, #5e6b5a, #9a8b6f]` |
| CategoryPieChart stroke | `#111722` | `var(--bg-elev)` (#fbf7ee) |
| Legend text colors | `#7A80A0` / `#9AA0BE` | `var(--ink-soft)` / `var(--ink)` |

CategoryPieChart: add `.donut-wrap` + `.legend-list` + `.legend-row` CSS classes. Add center label overlay showing total.

## Section 7 — Transactions page

**Files:** `src/app/transactions/page.tsx`, `src/components/transactions/TransactionTable.tsx`, `src/components/transactions/CategoryDropdown.tsx`

Page structure:
- Chapter eyebrow "Chapter II · The Day Book", title "Transactions", subtitle italic "every entry, posted and dated"
- Fleuron rule

Table (`TransactionTable`):
- Container: `.ledger-table-wrap` + `table.ledger`
- `<thead>`: `var(--paper-shade)` bg, `1.5px solid var(--ink)` bottom border, mono 10px uppercase labels
- Row hover: `rgba(139,44,29,0.035)` tint
- `td` amounts: expenses in `var(--ink)` (not red), credits in `var(--success)` moss green
- Remove the "Source" column
- Amount formatting: full IDR with sign (`-Rp` / `+Rp` or just show sign)

Filter bar: `.filters` + `.field` CSS classes; inputs/selects use `var(--bg-elev)` bg + `var(--rule)` border

`CategoryDropdown`:
- Trigger: `.cat-btn` — faint dashed underline in `var(--accent-soft)`, text in `var(--accent)`
- Dropdown: `.cat-menu` — paper bg, rule border, `var(--shadow-page)` shadow

## Section 8 — Upload modal

**File:** `src/components/modals/UploadModal.tsx`

- Overlay: `rgba(31, 26, 20, 0.34)` (warm dark, not `rgba(0,0,0,0.75)`)
- Modal container: `.modal` CSS class — `var(--bg-elev)`, `var(--rule)` border, `var(--shadow-page)`
- Title: "Add to the ledger" (`.modal__title`), subtitle italic "drop a bank statement and I'll post the entries" (`.modal__sub`)
- Dropzone: `.dropzone` CSS class; drag state adds `.drag`; dashed `var(--rule)` border
- Bank picker: `.bank-pick` + `.bank-grid` + `.bank-opt` CSS classes; selected = `.on` (ink bg + paper text)
- Action buttons: `.btn-primary` (oxblood) + `.btn-ghost` (bordered, ghost)
- Parsing progress: `.parsing` + `.parsing__bar` + `.parsing__fill` + `.parsing__txt`
- Done/Error states: reskin to use bookish tokens (moss green for success, oxblood for error)
- All real PDF parsing + API logic stays untouched

## What does NOT change

- `src/lib/` — all data logic, types, storage, dedup
- `src/app/api/parse/route.ts` — backend unchanged
- Component props/interfaces — same contracts, only visual layer changes
- The `d3` dependency — kept for chart rendering

## Files to create

- `src/app/bookish.css`
- `src/app/app.css`
- `docs/superpowers/specs/2026-05-30-bookish-ledger-redesign.md` (this file)

## Files to modify

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/SummaryCards.tsx`
- `src/components/dashboard/CalendarHeatmap.tsx`
- `src/components/dashboard/SpendingBarChart.tsx`
- `src/components/dashboard/FrequencyChart.tsx`
- `src/components/dashboard/CategoryPieChart.tsx`
- `src/components/dashboard/PeriodToggle.tsx`
- `src/app/transactions/page.tsx`
- `src/components/transactions/TransactionTable.tsx`
- `src/components/transactions/CategoryDropdown.tsx`
- `src/components/modals/UploadModal.tsx`
