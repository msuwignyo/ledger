# Ledger — Spending Visualizer Design

**Date:** 2026-05-27
**Status:** Approved

---

## Overview

A personal, single-user web app built on Next.js 16 + React 19 that lets you upload Indonesian bank/credit card statement PDFs, parses transactions using the Claude API, and visualizes spending with interactive D3.js charts. All data persists in `localStorage`. No auth, no external database.

---

## Architecture

### Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind v4 |
| Language | TypeScript |
| Linting/Formatting | Biome |
| Charts | D3.js (v7) |
| PDF extraction | `pdfjs-dist` (client-side Web Worker) |
| AI parsing | `@anthropic-ai/sdk` via Next.js Route Handler |
| Persistence | `localStorage` |

### Routes

| Route | Purpose |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Charts view |
| `/transactions` | Transaction table with editable categories |
| `/api/parse` | Server-side Route Handler — calls Claude API to parse extracted PDF text |

The Claude API key lives in `.env.local` as `ANTHROPIC_API_KEY` and is never exposed to the browser.

---

## Data Model

```ts
type Transaction = {
  id: string             // crypto.randomUUID()
  date: string           // ISO 8601, e.g. "2026-04-15"
  description: string    // raw merchant name from statement
  amount: number         // negative = expense, positive = credit/refund
  category: string       // AI-assigned, user-editable
  bank: "mandiri" | "bca" | "cimb" | "smbc"
  sourceFile: string     // original PDF filename
}
```

### localStorage Keys

| Key | Value |
|---|---|
| `ledger:transactions` | `Transaction[]` (JSON) |
| `ledger:categories` | `string[]` — master category list for dropdown |

Default categories: `Dining`, `Groceries`, `Transport`, `Shopping`, `Bills & Utilities`, `Health`, `Entertainment`, `Travel`, `Other`.

---

## PDF Parsing Flow

1. User selects a PDF in the Upload modal
2. `pdfjs-dist` extracts raw text in a browser Web Worker (no server call)
3. Extracted text is sent to `/api/parse` along with the bank name
4. The Route Handler sends the text + a structured prompt to `claude-haiku-4-5-20251001` (fast, low-cost)
5. Claude returns a JSON array: `{ date, description, amount, category }[]`
6. Client deduplicates against existing transactions by matching on `date + description + amount`
7. New transactions are appended to `ledger:transactions` in localStorage
8. UI refreshes

### Deduplication

A transaction is considered a duplicate if an existing entry shares the same `date`, `description`, and `amount`. Re-uploading the same statement is safe.

### Error States

| Error | Handling |
|---|---|
| No API key in `.env.local` | `/api/parse` returns 500; client shows "API not configured" message |
| Claude returns malformed JSON | Show raw Claude response in an expandable error block |
| PDF has no extractable text (scanned image) | `pdfjs-dist` returns empty string; client shows "Could not extract text — scanned PDFs are not supported" |
| Network failure | Show retry button |

---

## UI & Components

### Layout

Dark sidebar (fixed, 200px wide) + main content area.

```
┌──────────────┬─────────────────────────────────┐
│  Sidebar     │  Main content                   │
│              │                                 │
│  Ledger      │  (Dashboard or Transactions)    │
│              │                                 │
│  Dashboard   │                                 │
│  Transactions│                                 │
│              │                                 │
│  [Upload PDF]│                                 │
└──────────────┴─────────────────────────────────┘
```

### Dashboard Page (`/dashboard`)

**Controls (top bar):**
- **Period toggle** (top-right): `Monthly | Weekly | Daily` — controls the time granularity for all charts and summary cards
- **Chart-type toggle** (on the left chart panel): `Bar | Frequency` — switches the left chart between spending totals (bar) and transaction count per day (dot/scatter)

**Summary cards (3 across):**
- Total spend for selected period
- Number of transactions
- Top spending category

**Charts (below cards):**
- Left (2/3 width): **Bar chart** (default) — spending over time, one bar per period unit. D3 x-axis = time, y-axis = IDR amount. Switching to **Frequency** renders a D3 dot/scatter plot of transaction count per day.
- Right (1/3 width): **Pie/donut chart** — spending by category for the selected period. D3 arc generator.

### Transactions Page (`/transactions`)

Sortable, filterable table.

**Columns:** Date · Description · Amount · Category · Bank · Source File

**Category column:** Clicking opens an inline dropdown (populated from `ledger:categories`) to reassign. Change saved immediately to localStorage.

**Filters (top bar):** Date range picker (start/end) + category multi-select.

**Sort:** Click any column header to sort ascending/descending.

### Upload Modal

Triggered by "Upload PDF" button in sidebar. Accessible from any page.

**States:**
1. **Idle** — drag-and-drop zone + file picker button + bank selector dropdown (Mandiri / BCA / CIMB / SMBC)
2. **Extracting** — spinner, "Extracting text from PDF..."
3. **Parsing** — spinner, "Asking Claude to find transactions..."
4. **Done** — "Found 47 transactions. 12 were duplicates and skipped. 35 added."
5. **Error** — message + expandable details

---

## Component Structure

```
src/
  app/
    layout.tsx          — root layout with sidebar
    page.tsx            — redirect to /dashboard
    dashboard/
      page.tsx
    transactions/
      page.tsx
    api/
      parse/
        route.ts        — Claude API call
  components/
    layout/
      Sidebar.tsx
    dashboard/
      SummaryCards.tsx
      PeriodToggle.tsx
      SpendingBarChart.tsx    — D3
      CategoryPieChart.tsx    — D3
      FrequencyChart.tsx      — D3
    transactions/
      TransactionTable.tsx
      CategoryDropdown.tsx
    modals/
      UploadModal.tsx
  lib/
    storage.ts          — localStorage read/write helpers
    transactions.ts     — grouping/filtering logic
    dedup.ts            — duplicate detection
```

---

## Libraries to Install

```
d3
pdfjs-dist
@anthropic-ai/sdk
@types/d3
```

---

## Out of Scope

- Multi-user / authentication
- Server-side database
- Export to CSV/Excel
- Budget tracking or spending limits
- Push notifications or recurring summaries
- Support for scanned (image-based) PDFs
