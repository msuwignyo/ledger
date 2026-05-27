# Ledger Spending Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal spending visualizer that parses Indonesian bank statement PDFs via Claude AI and renders interactive D3.js charts persisted in localStorage.

**Architecture:** Next.js 16 App Router with a dark sidebar layout. Pure utility logic (storage, dedup, grouping) lives in `src/lib/`. All UI components that use hooks or browser APIs must include `"use client"`. The Claude API key stays server-side in `.env.local` accessed only from the `/api/parse` Route Handler.

**Tech Stack:** Next.js 16, React 19 (React Compiler enabled), Tailwind v4, TypeScript, Biome, D3.js v7, pdfjs-dist, @anthropic-ai/sdk, vitest

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/types.ts` | Shared TypeScript types: `Transaction`, `BankName`, `Period`, `ChartType` |
| `src/lib/storage.ts` | Read/write `localStorage` for transactions and categories |
| `src/lib/dedup.ts` | Deduplicate incoming transactions against stored ones |
| `src/lib/transactions.ts` | Group/filter transactions by month, week, day; compute summaries |
| `src/app/layout.tsx` | Root layout: `<html>`, `<body>`, sidebar + main content slot |
| `src/app/page.tsx` | Redirect `/` → `/dashboard` |
| `src/app/dashboard/page.tsx` | Dashboard page: assembles all dashboard components |
| `src/app/transactions/page.tsx` | Transactions page: assembles table + filters |
| `src/app/api/parse/route.ts` | POST handler: receives PDF text → calls Claude → returns `Transaction[]` |
| `src/components/layout/Sidebar.tsx` | Dark sidebar with nav links and Upload PDF button |
| `src/components/dashboard/PeriodToggle.tsx` | Monthly/Weekly/Daily pill toggle |
| `src/components/dashboard/SummaryCards.tsx` | 3 stat cards: total, count, top category |
| `src/components/dashboard/SpendingBarChart.tsx` | D3 bar chart: spending over time |
| `src/components/dashboard/FrequencyChart.tsx` | D3 dot/scatter chart: transaction count per day |
| `src/components/dashboard/CategoryPieChart.tsx` | D3 donut chart: spending by category |
| `src/components/transactions/CategoryDropdown.tsx` | Inline dropdown to reassign a transaction's category |
| `src/components/transactions/TransactionTable.tsx` | Sortable/filterable table of all transactions |
| `src/components/modals/UploadModal.tsx` | PDF upload modal with 5 states: idle/extracting/parsing/done/error |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json` (via pnpm)
- Create: `.env.local`
- Create: `.env.local.example`

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
cd /path/to/ledger
pnpm add d3 pdfjs-dist @anthropic-ai/sdk
pnpm add -D @types/d3 vitest @vitest/ui
```

Expected: packages added with no peer-dependency warnings.

- [ ] **Step 2: Add vitest config**

Create `vitest.config.ts` at the project root:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

Then add test scripts to `package.json` (only the scripts section needs updating):

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check",
  "format": "biome format --write",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `.env.local`**

Create the file at the project root:

```
ANTHROPIC_API_KEY=your_api_key_here
```

- [ ] **Step 4: Create `.env.local.example`**

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

- [ ] **Step 5: Add `.superpowers/` to `.gitignore`**

Open `.gitignore` (create it if it doesn't exist) and add:

```
.env.local
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
git add package.json .env.local.example .gitignore
git commit -m "feat: install dependencies (d3, pdfjs-dist, anthropic, vitest)"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export type BankName = "mandiri" | "bca" | "cimb" | "smbc";

export type Period = "monthly" | "weekly" | "daily";

export type ChartType = "bar" | "frequency";

export type Transaction = {
  id: string;
  date: string; // ISO 8601, e.g. "2026-04-15"
  description: string;
  amount: number; // negative = expense, positive = credit/refund
  category: string;
  bank: BankName;
  sourceFile: string;
};

export type GroupedSpending = {
  label: string; // e.g. "Apr 2026", "Week 14", "2026-04-15"
  total: number;
  count: number;
};

export type CategorySpending = {
  category: string;
  total: number;
  count: number;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add core types"
```

---

## Task 3: Storage Helpers

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

import {
  getTransactions,
  saveTransactions,
  getCategories,
  saveCategories,
} from "./storage";
import type { Transaction } from "./types";

const tx: Transaction = {
  id: "1",
  date: "2026-04-15",
  description: "Indomaret",
  amount: -45000,
  category: "Groceries",
  bank: "bca",
  sourceFile: "april.pdf",
};

describe("storage", () => {
  beforeEach(() => localStorageMock.clear());

  it("getTransactions returns [] when empty", () => {
    expect(getTransactions()).toEqual([]);
  });

  it("saveTransactions and getTransactions round-trip", () => {
    saveTransactions([tx]);
    expect(getTransactions()).toEqual([tx]);
  });

  it("getCategories returns defaults when empty", () => {
    const cats = getCategories();
    expect(cats).toContain("Dining");
    expect(cats).toContain("Other");
    expect(cats.length).toBeGreaterThan(0);
  });

  it("saveCategories and getCategories round-trip", () => {
    saveCategories(["Food", "Transport"]);
    expect(getCategories()).toEqual(["Food", "Transport"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL with "Cannot find module './storage'"

- [ ] **Step 3: Implement `src/lib/storage.ts`**

```ts
import type { Transaction } from "./types";

const KEYS = {
  transactions: "ledger:transactions",
  categories: "ledger:categories",
} as const;

const DEFAULT_CATEGORIES = [
  "Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Health",
  "Entertainment",
  "Travel",
  "Other",
];

export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.transactions);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
}

export function getCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(KEYS.categories);
    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: string[]): void {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add storage helpers with tests"
```

---

## Task 4: Deduplication Logic

**Files:**
- Create: `src/lib/dedup.ts`
- Create: `src/lib/dedup.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/dedup.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deduplicateTransactions } from "./dedup";
import type { Transaction } from "./types";

const existing: Transaction[] = [
  {
    id: "1",
    date: "2026-04-15",
    description: "Grab",
    amount: -23000,
    category: "Transport",
    bank: "bca",
    sourceFile: "april.pdf",
  },
];

const incoming: Transaction[] = [
  // duplicate — same date, description, amount
  {
    id: "2",
    date: "2026-04-15",
    description: "Grab",
    amount: -23000,
    category: "Transport",
    bank: "bca",
    sourceFile: "april.pdf",
  },
  // new transaction
  {
    id: "3",
    date: "2026-04-16",
    description: "Indomaret",
    amount: -45000,
    category: "Groceries",
    bank: "bca",
    sourceFile: "april.pdf",
  },
];

describe("deduplicateTransactions", () => {
  it("filters out transactions that already exist", () => {
    const result = deduplicateTransactions(existing, incoming);
    expect(result.newTransactions).toHaveLength(1);
    expect(result.newTransactions[0].description).toBe("Indomaret");
  });

  it("reports correct duplicate count", () => {
    const result = deduplicateTransactions(existing, incoming);
    expect(result.duplicateCount).toBe(1);
  });

  it("returns all when no duplicates", () => {
    const result = deduplicateTransactions([], incoming);
    expect(result.newTransactions).toHaveLength(2);
    expect(result.duplicateCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL with "Cannot find module './dedup'"

- [ ] **Step 3: Implement `src/lib/dedup.ts`**

```ts
import type { Transaction } from "./types";

type DeduplicateResult = {
  newTransactions: Transaction[];
  duplicateCount: number;
};

function makeKey(t: Transaction): string {
  return `${t.date}|${t.description}|${t.amount}`;
}

export function deduplicateTransactions(
  existing: Transaction[],
  incoming: Transaction[]
): DeduplicateResult {
  const existingKeys = new Set(existing.map(makeKey));
  const newTransactions = incoming.filter((t) => !existingKeys.has(makeKey(t)));
  return {
    newTransactions,
    duplicateCount: incoming.length - newTransactions.length,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dedup.ts src/lib/dedup.test.ts
git commit -m "feat: add deduplication logic with tests"
```

---

## Task 5: Transaction Grouping & Filtering

**Files:**
- Create: `src/lib/transactions.ts`
- Create: `src/lib/transactions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/transactions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  groupTransactions,
  filterByDateRange,
  computeSummary,
  getCategorySpending,
} from "./transactions";
import type { Transaction } from "./types";

const txs: Transaction[] = [
  { id: "1", date: "2026-04-01", description: "A", amount: -100000, category: "Dining", bank: "bca", sourceFile: "f.pdf" },
  { id: "2", date: "2026-04-15", description: "B", amount: -200000, category: "Transport", bank: "bca", sourceFile: "f.pdf" },
  { id: "3", date: "2026-05-01", description: "C", amount: -50000, category: "Dining", bank: "mandiri", sourceFile: "g.pdf" },
  { id: "4", date: "2026-05-10", description: "D", amount: 500000, category: "Other", bank: "bca", sourceFile: "g.pdf" }, // credit
];

describe("groupTransactions - monthly", () => {
  it("groups by month label", () => {
    const groups = groupTransactions(txs, "monthly");
    const labels = groups.map((g) => g.label);
    expect(labels).toContain("Apr 2026");
    expect(labels).toContain("May 2026");
  });

  it("sums expenses only (negative amounts)", () => {
    const groups = groupTransactions(txs, "monthly");
    const apr = groups.find((g) => g.label === "Apr 2026")!;
    expect(apr.total).toBe(300000);
  });
});

describe("filterByDateRange", () => {
  it("filters transactions within range (inclusive)", () => {
    const result = filterByDateRange(txs, "2026-04-01", "2026-04-30");
    expect(result).toHaveLength(2);
  });

  it("returns all when no range given", () => {
    expect(filterByDateRange(txs, null, null)).toHaveLength(4);
  });
});

describe("computeSummary", () => {
  it("returns total expenses, count, and top category", () => {
    const summary = computeSummary(txs);
    expect(summary.totalExpense).toBe(350000); // 100k+200k+50k, skips credit
    expect(summary.transactionCount).toBe(4);
    expect(summary.topCategory).toBe("Dining"); // appears twice
  });
});

describe("getCategorySpending", () => {
  it("returns expense totals per category", () => {
    const result = getCategorySpending(txs);
    const dining = result.find((c) => c.category === "Dining")!;
    expect(dining.total).toBe(150000);
  });

  it("excludes credits (positive amounts)", () => {
    const result = getCategorySpending(txs);
    const other = result.find((c) => c.category === "Other");
    expect(other).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL with "Cannot find module './transactions'"

- [ ] **Step 3: Implement `src/lib/transactions.ts`**

```ts
import type { Transaction, GroupedSpending, CategorySpending, Period } from "./types";

export function groupTransactions(
  transactions: Transaction[],
  period: Period
): GroupedSpending[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const label = getPeriodLabel(tx.date, period);
    const entry = map.get(label) ?? { total: 0, count: 0 };
    if (tx.amount < 0) entry.total += Math.abs(tx.amount);
    entry.count += 1;
    map.set(label, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, { total, count }]) => ({ label, total, count }));
}

function getPeriodLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "monthly") {
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  }
  if (period === "weekly") {
    const weekNum = getISOWeek(d);
    return `Week ${weekNum} ${d.getFullYear()}`;
  }
  // daily
  return dateStr;
}

function getISOWeek(d: Date): number {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

export function filterByDateRange(
  transactions: Transaction[],
  start: string | null,
  end: string | null
): Transaction[] {
  return transactions.filter((tx) => {
    if (start && tx.date < start) return false;
    if (end && tx.date > end) return false;
    return true;
  });
}

export function computeSummary(transactions: Transaction[]): {
  totalExpense: number;
  transactionCount: number;
  topCategory: string;
} {
  const expenses = transactions.filter((tx) => tx.amount < 0);
  const totalExpense = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const categoryCounts = new Map<string, number>();
  for (const tx of expenses) {
    categoryCounts.set(tx.category, (categoryCounts.get(tx.category) ?? 0) + 1);
  }
  let topCategory = "—";
  let maxCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCount) { maxCount = count; topCategory = cat; }
  }
  return { totalExpense, transactionCount: transactions.length, topCategory };
}

export function getCategorySpending(transactions: Transaction[]): CategorySpending[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // skip credits
    const entry = map.get(tx.category) ?? { total: 0, count: 0 };
    entry.total += Math.abs(tx.amount);
    entry.count += 1;
    map.set(tx.category, entry);
  }
  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: PASS (8 tests total across all test files)

- [ ] **Step 5: Commit**

```bash
git add src/lib/transactions.ts src/lib/transactions.test.ts
git commit -m "feat: add transaction grouping and filtering logic with tests"
```

---

## Task 6: App Shell — Layout, Sidebar, and Shell Pages

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/transactions/page.tsx`
- Create: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Read the Next.js 16 layouts guide**

Before writing layout code, skim:
```
node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
```
Key points: layouts preserve state across navigation; the root layout must include `<html>` and `<body>`; navigation uses the `<Link>` component from `next/link`.

- [ ] **Step 2: Create `src/components/layout/Sidebar.tsx`**

This is a Client Component (uses state for modal open/close and `usePathname` for active link).

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UploadModal } from "@/components/modals/UploadModal";

export function Sidebar() {
  const pathname = usePathname();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <aside className="w-50 bg-zinc-900 flex flex-col shrink-0 min-h-screen px-4 py-6">
        <span className="text-white font-bold text-lg mb-8">Ledger</span>

        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded text-sm transition-colors ${
              pathname === "/dashboard"
                ? "bg-indigo-500/20 text-white border-l-2 border-indigo-500 pl-[10px]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/transactions"
            className={`px-3 py-2 rounded text-sm transition-colors ${
              pathname === "/transactions"
                ? "bg-indigo-500/20 text-white border-l-2 border-indigo-500 pl-[10px]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            Transactions
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded transition-colors"
        >
          + Upload PDF
        </button>
      </aside>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ledger",
  description: "Personal spending visualizer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full bg-zinc-50">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update `src/app/page.tsx` (root redirect)**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 5: Create `src/app/dashboard/page.tsx` (shell)**

```tsx
export default function DashboardPage() {
  return <div className="text-zinc-400">Dashboard coming soon</div>;
}
```

- [ ] **Step 6: Create `src/app/transactions/page.tsx` (shell)**

```tsx
export default function TransactionsPage() {
  return <div className="text-zinc-400">Transactions coming soon</div>;
}
```

- [ ] **Step 7: Start dev server and verify the shell renders**

```bash
pnpm dev
```

Open http://localhost:3000. Expected: dark sidebar with "Ledger" title, two nav links, and the "Upload PDF" button. Main area shows "Dashboard coming soon". Navigation between `/dashboard` and `/transactions` should highlight the active link.

Note: UploadModal doesn't exist yet — you'll see a compile error. Create a temporary stub at `src/components/modals/UploadModal.tsx`:

```tsx
"use client";

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <p>Upload Modal (coming soon)</p>
        <button type="button" onClick={onClose} className="mt-4 text-sm underline">Close</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/dashboard/page.tsx \
        src/app/transactions/page.tsx src/components/layout/Sidebar.tsx \
        src/components/modals/UploadModal.tsx
git commit -m "feat: add app shell with sidebar layout and shell pages"
```

---

## Task 7: API Route Handler — PDF Parse Endpoint

**Files:**
- Create: `src/app/api/parse/route.ts`

- [ ] **Step 1: Read the Route Handlers guide**

Skim `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.  
Key: Route handlers export named functions (`GET`, `POST`, etc.) and use the Web `Request`/`Response` APIs. The file is `route.ts` in the app directory.

- [ ] **Step 2: Create `src/app/api/parse/route.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a financial data extractor. The user will provide raw text extracted from an Indonesian bank statement PDF. Extract all debit/credit transactions and return them as a JSON array.

Each transaction object must have exactly these fields:
- date: string (ISO 8601 format, e.g. "2026-04-15")
- description: string (merchant name or transaction description, keep it concise)
- amount: number (negative for expenses/debits, positive for credits/refunds, in IDR)
- category: string (one of: Dining, Groceries, Transport, Shopping, Bills & Utilities, Health, Entertainment, Travel, Other)

Rules:
- Skip header rows, balance summaries, and non-transaction lines
- For transfers, use the recipient/sender name as description
- Infer category from the description (e.g. Grab/Gojek = Transport, Indomaret/Alfamart = Groceries)
- Return ONLY valid JSON — no markdown, no explanation, just the array

Example output:
[{"date":"2026-04-15","description":"Grab","amount":-23000,"category":"Transport"}]`;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { text: string; bank: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { text, bank } = body;
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text field" }, { status: 400 });
  }

  const userMessage = `Bank: ${bank}\n\nStatement text:\n${text}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      return NextResponse.json({ error: "Unexpected response type from Claude" }, { status: 500 });
    }

    let transactions: unknown;
    try {
      transactions = JSON.parse(rawContent.text);
    } catch {
      return NextResponse.json(
        { error: "Claude returned malformed JSON", raw: rawContent.text },
        { status: 422 }
      );
    }

    return NextResponse.json({ transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify the route is reachable**

With `pnpm dev` running, test the endpoint:

```bash
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"01 Apr 2026  GRAB  -23,000","bank":"bca"}'
```

Expected: a JSON response with a `transactions` array (or an error if your API key is not set — that's expected if `.env.local` is not configured yet).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/parse/route.ts
git commit -m "feat: add Claude API parse route handler"
```

---

## Task 8: Upload Modal

**Files:**
- Modify: `src/components/modals/UploadModal.tsx` (replace the stub)

- [ ] **Step 1: Replace the stub with the full `UploadModal.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { getTransactions, saveTransactions } from "@/lib/storage";
import { deduplicateTransactions } from "@/lib/dedup";
import type { BankName, Transaction } from "@/lib/types";

type UploadState =
  | { status: "idle" }
  | { status: "extracting" }
  | { status: "parsing" }
  | { status: "done"; added: number; duplicates: number }
  | { status: "error"; message: string; raw?: string };

const BANKS: { value: BankName; label: string }[] = [
  { value: "mandiri", label: "Mandiri" },
  { value: "bca", label: "BCA" },
  { value: "cimb", label: "CIMB" },
  { value: "smbc", label: "SMBC" },
];

async function extractTextFromPDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n");
}

export function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [bank, setBank] = useState<BankName>("bca");
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setState({ status: "error", message: "Please upload a PDF file." });
      return;
    }

    setState({ status: "extracting" });

    let text: string;
    try {
      text = await extractTextFromPDF(file);
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to read PDF.",
      });
      return;
    }

    if (!text.trim()) {
      setState({
        status: "error",
        message: "Could not extract text — scanned PDFs are not supported.",
      });
      return;
    }

    setState({ status: "parsing" });

    let parsed: { date: string; description: string; amount: number; category: string }[];
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, bank }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          message: data.error ?? "API error",
          raw: data.raw,
        });
        return;
      }
      parsed = data.transactions;
    } catch {
      setState({
        status: "error",
        message: "Network error — please try again.",
      });
      return;
    }

    const incoming: Transaction[] = parsed.map((t) => ({
      id: crypto.randomUUID(),
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category,
      bank,
      sourceFile: file.name,
    }));

    const existing = getTransactions();
    const { newTransactions, duplicateCount } = deduplicateTransactions(existing, incoming);
    saveTransactions([...existing, ...newTransactions]);

    setState({
      status: "done",
      added: newTransactions.length,
      duplicates: duplicateCount,
    });
  }

  function handleClose() {
    setState({ status: "idle" });
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Upload Statement</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {state.status === "idle" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Bank</label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value as BankName)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {BANKS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-zinc-300 hover:border-zinc-400"
              }`}
            >
              <p className="text-zinc-500 text-sm">Drag & drop a PDF here, or click to select</p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </>
        )}

        {(state.status === "extracting" || state.status === "parsing") && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-600">
              {state.status === "extracting"
                ? "Extracting text from PDF..."
                : "Asking Claude to find transactions..."}
            </p>
          </div>
        )}

        {state.status === "done" && (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-zinc-800 font-medium">
              {state.added} transaction{state.added !== 1 ? "s" : ""} added.
            </p>
            {state.duplicates > 0 && (
              <p className="text-zinc-500 text-sm mt-1">
                {state.duplicates} duplicate{state.duplicates !== 1 ? "s" : ""} skipped.
              </p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        )}

        {state.status === "error" && (
          <div className="py-4">
            <p className="text-red-600 text-sm font-medium mb-2">{state.message}</p>
            {state.raw && (
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer">View raw response</summary>
                <pre className="mt-2 p-2 bg-zinc-100 rounded overflow-auto max-h-40">{state.raw}</pre>
              </details>
            )}
            <button
              type="button"
              onClick={() => setState({ status: "idle" })}
              className="mt-4 text-sm text-indigo-600 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test the upload modal manually**

With `pnpm dev` running, click "Upload PDF" in the sidebar. Verify:
- Modal opens with bank dropdown and drag-and-drop zone
- ESC key or clicking outside closes it
- Selecting a non-PDF file shows an error
- (Full PDF test can be done after your API key is configured)

- [ ] **Step 3: Commit**

```bash
git add src/components/modals/UploadModal.tsx
git commit -m "feat: implement PDF upload modal with Claude parsing and dedup"
```

---

## Task 9: Dashboard — SummaryCards and PeriodToggle

**Files:**
- Create: `src/components/dashboard/SummaryCards.tsx`
- Create: `src/components/dashboard/PeriodToggle.tsx`

- [ ] **Step 1: Create `src/components/dashboard/PeriodToggle.tsx`**

```tsx
"use client";

import type { Period } from "@/lib/types";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
];

export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 bg-zinc-100 p-1 rounded-full">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/dashboard/SummaryCards.tsx`**

```tsx
import type { Transaction } from "@/lib/types";
import { computeSummary } from "@/lib/transactions";

function formatIDR(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const { totalExpense, transactionCount, topCategory } = computeSummary(transactions);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Total Spent</p>
        <p className="text-2xl font-bold text-zinc-900">{formatIDR(totalExpense)}</p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Transactions</p>
        <p className="text-2xl font-bold text-zinc-900">{transactionCount}</p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Top Category</p>
        <p className="text-2xl font-bold text-zinc-900">{topCategory}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/SummaryCards.tsx src/components/dashboard/PeriodToggle.tsx
git commit -m "feat: add SummaryCards and PeriodToggle components"
```

---

## Task 10: Dashboard — SpendingBarChart (D3)

**Files:**
- Create: `src/components/dashboard/SpendingBarChart.tsx`

- [ ] **Step 1: Create `src/components/dashboard/SpendingBarChart.tsx`**

This is a Client Component. D3 mutations happen inside `useEffect` on a `<svg>` ref. The React Compiler is enabled — do not reassign refs or mutate state directly outside of the setter.

```tsx
"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { GroupedSpending } from "@/lib/types";

export function SpendingBarChart({ data }: { data: GroupedSpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 16, right: 16, bottom: 40, left: 64 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total) ?? 0])
      .nice()
      .range([height, 0]);

    // Gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e4e4e7"));

    // Bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("y", (d) => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.total))
      .attr("fill", "#6366f1")
      .attr("rx", 3);

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px")
      .attr("dy", "1.2em");

    // Y axis
    svg
      .append("g")
      .call(
        d3.axisLeft(y)
          .ticks(4)
          .tickFormat((v) => {
            const n = Number(v);
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`;
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
            return String(n);
          })
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px");
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-zinc-400 text-sm">
        No data yet — upload a statement to get started.
      </div>
    );
  }

  return <svg ref={svgRef} className="w-full" style={{ height: 240 }} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/SpendingBarChart.tsx
git commit -m "feat: add D3 spending bar chart"
```

---

## Task 11: Dashboard — CategoryPieChart (D3)

**Files:**
- Create: `src/components/dashboard/CategoryPieChart.tsx`

- [ ] **Step 1: Create `src/components/dashboard/CategoryPieChart.tsx`**

```tsx
"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { CategorySpending } from "@/lib/types";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#f43f5e",
  "#a78bfa", "#34d399", "#fb923c", "#60a5fa",
];

export function CategoryPieChart({ data }: { data: CategorySpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 200;
    const radius = size / 2;
    const innerRadius = radius * 0.55; // donut hole

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", size)
      .attr("height", size)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const pie = d3.pie<CategorySpending>().value((d) => d.total).sort(null);
    const arc = d3.arc<d3.PieArcDatum<CategorySpending>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 4);

    const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "white")
      .attr("stroke-width", 2);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
        No data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg ref={svgRef} />
      <div className="w-full flex flex-col gap-1">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.category} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-zinc-600 truncate flex-1">{d.category}</span>
            <span className="text-zinc-500">
              {total > 0 ? Math.round((d.total / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/CategoryPieChart.tsx
git commit -m "feat: add D3 category donut chart"
```

---

## Task 12: Dashboard — FrequencyChart (D3)

**Files:**
- Create: `src/components/dashboard/FrequencyChart.tsx`

- [ ] **Step 1: Create `src/components/dashboard/FrequencyChart.tsx`**

```tsx
"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Transaction } from "@/lib/types";

type DayCount = { date: string; count: number };

function countByDay(transactions: Transaction[]): DayCount[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    map.set(tx.date, (map.get(tx.date) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function FrequencyChart({ transactions }: { transactions: Transaction[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const data = countByDay(transactions);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 16, right: 16, bottom: 40, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) ?? 1])
      .nice()
      .range([height, 0]);

    // Gridlines
    svg
      .append("g")
      .call(
        d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e4e4e7"));

    // Dots
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(new Date(d.date)))
      .attr("cy", (d) => y(d.count))
      .attr("r", 4)
      .attr("fill", "#6366f1")
      .attr("fill-opacity", 0.7);

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px")
      .attr("dy", "1.2em");

    // Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(4))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px");
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-zinc-400 text-sm">
        No data yet — upload a statement to get started.
      </div>
    );
  }

  return <svg ref={svgRef} className="w-full" style={{ height: 240 }} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/FrequencyChart.tsx
git commit -m "feat: add D3 frequency dot chart"
```

---

## Task 13: Dashboard Page Assembly

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace the dashboard page shell**

```tsx
"use client";

import { useState, useEffect } from "react";
import { PeriodToggle } from "@/components/dashboard/PeriodToggle";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendingBarChart } from "@/components/dashboard/SpendingBarChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FrequencyChart } from "@/components/dashboard/FrequencyChart";
import { getTransactions } from "@/lib/storage";
import { groupTransactions, getCategorySpending } from "@/lib/transactions";
import type { ChartType, Period, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());

    // Refresh when storage is updated (e.g. after upload)
    function onStorage(e: StorageEvent) {
      if (e.key === "ledger:transactions") setTransactions(getTransactions());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const grouped = groupTransactions(transactions, period);
  const categorySpending = getCategorySpending(transactions);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <SummaryCards transactions={transactions} />

      <div className="flex gap-4">
        {/* Left: bar or frequency chart */}
        <div className="flex-[2] bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700">Spending Over Time</h2>
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

        {/* Right: pie chart */}
        <div className="flex-1 bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">By Category</h2>
          <CategoryPieChart data={categorySpending} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

With `pnpm dev` running, navigate to `/dashboard`. Expected:
- Period toggle and page title visible
- Summary cards show "—" / 0 (no data yet)
- Charts show empty state messages
- After uploading a PDF, navigate back to `/dashboard` and refresh — charts should populate

Note: Because `storage` events only fire in *other* tabs, after uploading you'll need to refresh the dashboard page manually in the same tab. This is a known localStorage limitation; it's acceptable for a personal app.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: assemble dashboard page with D3 charts and period toggle"
```

---

## Task 14: Transactions Page

**Files:**
- Create: `src/components/transactions/CategoryDropdown.tsx`
- Create: `src/components/transactions/TransactionTable.tsx`
- Modify: `src/app/transactions/page.tsx`

- [ ] **Step 1: Create `src/components/transactions/CategoryDropdown.tsx`**

```tsx
"use client";

import { useState } from "react";
import { getCategories, saveCategories } from "@/lib/storage";

export function CategoryDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const categories = getCategories();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg min-w-40 py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 ${
                cat === value ? "text-indigo-600 font-medium" : "text-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/transactions/TransactionTable.tsx`**

```tsx
"use client";

import { useState } from "react";
import { CategoryDropdown } from "./CategoryDropdown";
import type { Transaction } from "@/lib/types";

type SortKey = keyof Pick<Transaction, "date" | "description" | "amount" | "category" | "bank">;
type SortDir = "asc" | "desc";

function formatIDR(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("id-ID");
  return amount < 0 ? `-Rp ${abs}` : `+Rp ${abs}`;
}

export function TransactionTable({
  transactions,
  onCategoryChange,
}: {
  transactions: Transaction[];
  onCategoryChange: (id: string, category: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const categories = ["all", ...Array.from(new Set(transactions.map((t) => t.category))).sort()];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = transactions
    .filter((t) => filterCategory === "all" || t.category === filterCategory)
    .filter((t) => !filterStart || t.date >= filterStart)
    .filter((t) => !filterEnd || t.date <= filterEnd)
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide cursor-pointer select-none hover:text-zinc-700"
        onClick={() => handleSort(col)}
      >
        {label}{" "}
        {active ? (sortDir === "asc" ? "↑" : "↓") : <span className="opacity-30">↕</span>}
      </th>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">From</label>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">To</label>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-zinc-400 pb-1.5">{filtered.length} transactions</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <SortHeader col="date" label="Date" />
                <SortHeader col="description" label="Description" />
                <SortHeader col="amount" label="Amount" />
                <SortHeader col="category" label="Category" />
                <SortHeader col="bank" label="Bank" />
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm text-zinc-600 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 text-sm text-zinc-800 max-w-xs truncate">{tx.description}</td>
                    <td className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${tx.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatIDR(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryDropdown
                        value={tx.category}
                        onChange={(cat) => onCategoryChange(tx.id, cat)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 uppercase">{tx.bank}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400 max-w-xs truncate">{tx.sourceFile}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/app/transactions/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { getTransactions, saveTransactions } from "@/lib/storage";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  function handleCategoryChange(id: string, category: string) {
    const updated = transactions.map((tx) =>
      tx.id === id ? { ...tx, category } : tx
    );
    setTransactions(updated);
    saveTransactions(updated);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-zinc-900">Transactions</h1>
      <TransactionTable
        transactions={transactions}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser**

Navigate to `/transactions`. Expected:
- Table with filter controls at the top
- Empty state when no data
- After uploading, rows appear with sortable columns and editable category dropdowns

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/CategoryDropdown.tsx \
        src/components/transactions/TransactionTable.tsx \
        src/app/transactions/page.tsx
git commit -m "feat: add transactions page with sortable table and inline category editing"
```

---

## Task 15: Final Wiring — Storage Event + Lint Check

**Files:**
- Modify: `src/app/dashboard/page.tsx` (fix cross-tab storage refresh limitation)
- Modify: `src/components/modals/UploadModal.tsx` (dispatch custom event after save)

The `storage` event only fires in *other* browser tabs/windows. To refresh the dashboard in the same tab after upload, dispatch a custom event from the modal.

- [ ] **Step 1: Dispatch a custom event after saving transactions in `UploadModal.tsx`**

In `UploadModal.tsx`, after `saveTransactions(...)`, add:

```ts
saveTransactions([...existing, ...newTransactions]);
window.dispatchEvent(new CustomEvent("ledger:updated")); // add this line
```

- [ ] **Step 2: Listen for the custom event in `src/app/dashboard/page.tsx`**

In the `useEffect` in `DashboardPage`, add a listener for `"ledger:updated"`:

```ts
useEffect(() => {
  setTransactions(getTransactions());

  function refresh() { setTransactions(getTransactions()); }

  window.addEventListener("storage", refresh);
  window.addEventListener("ledger:updated", refresh);
  return () => {
    window.removeEventListener("storage", refresh);
    window.removeEventListener("ledger:updated", refresh);
  };
}, []);
```

Also add the same listener in `src/app/transactions/page.tsx`:

```ts
useEffect(() => {
  setTransactions(getTransactions());

  function refresh() { setTransactions(getTransactions()); }
  window.addEventListener("ledger:updated", refresh);
  return () => window.removeEventListener("ledger:updated", refresh);
}, []);
```

- [ ] **Step 3: Run linter**

```bash
pnpm lint
```

Fix any errors reported by Biome before committing.

- [ ] **Step 4: Run tests one final time**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 5: Final commit**

```bash
git add src/components/modals/UploadModal.tsx \
        src/app/dashboard/page.tsx \
        src/app/transactions/page.tsx
git commit -m "feat: wire real-time refresh after PDF upload via custom event"
```

---

## Done

The app is fully implemented. To use it:

1. Set `ANTHROPIC_API_KEY` in `.env.local`
2. Run `pnpm dev`
3. Open http://localhost:3000
4. Click "Upload PDF", select your bank, and drop in a statement PDF
5. View charts on the Dashboard and edit categories on the Transactions page
