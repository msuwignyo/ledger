# Bookish Ledger Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the Ledger app from dark fintech to a bookish paper-and-ink aesthetic matching the Claude Design handoff in `financial-visualizer/project/Ledger.html`.

**Architecture:** Drop two CSS files (`bookish.css`, `app.css`) from the design bundle into `src/app/`, update `globals.css` to import them, then restyle every component to use the bookish CSS class names. Charts keep d3 — only colors change.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, d3, Google Fonts (EB Garamond, Lora, JetBrains Mono via CSS @import)

---

## File Map

**Create:**
- `src/app/bookish.css` — design system tokens + scoped `.bookish` base styles
- `src/app/app.css` — app-specific component classes (sidebar, panel, table, modal…)

**Modify:**
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/dashboard/SummaryCards.tsx`
- `src/components/dashboard/PeriodToggle.tsx`
- `src/components/dashboard/SpendingBarChart.tsx`
- `src/components/dashboard/FrequencyChart.tsx`
- `src/components/dashboard/CategoryPieChart.tsx`
- `src/components/dashboard/CalendarHeatmap.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/transactions/CategoryDropdown.tsx`
- `src/components/transactions/TransactionTable.tsx`
- `src/app/transactions/page.tsx`
- `src/components/modals/UploadModal.tsx`

---

## Task 1: CSS foundations

**Files:**
- Create: `src/app/bookish.css`
- Create: `src/app/app.css`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create `src/app/bookish.css`**

```css
/* ============================================================================
   Bookish Design System — tokens + scoped base styles
   ============================================================================ */

@import url("https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap");

:root {
  --stone-50:  #fafaf9;
  --stone-100: #f5f5f4;
  --stone-200: #e7e5e4;
  --stone-300: #d6d3d1;
  --stone-400: #a8a29e;
  --stone-500: #78716c;
  --stone-600: #57534e;
  --stone-700: #44403c;
  --stone-800: #292524;
  --stone-900: #1c1917;

  --paper:        #f6f1e6;
  --paper-edge:   #ece4d2;
  --paper-shade:  #e7decb;
  --ink:          #1f1a14;
  --ink-soft:     #4a4036;
  --ink-faint:    #8a7e6e;
  --rule:         #c9bfa9;
  --rule-soft:    #e3d9c4;

  --accent:       #8b2c1d;
  --accent-soft:  #b0533f;

  --success:      #4f6b3a;
  --warning:      #a3711b;
  --danger:       #8b2c1d;

  --bg:           var(--paper);
  --bg-elev:      #fbf7ee;
  --bg-sunk:      var(--paper-shade);
  --fg:           var(--ink);
  --fg-soft:      var(--ink-soft);
  --fg-faint:     var(--ink-faint);
  --border:       var(--rule);
  --border-soft:  var(--rule-soft);
  --selection-bg: #f0d9a8;

  --font-display: "EB Garamond", "Cormorant Garamond", Garamond, Georgia, "Times New Roman", serif;
  --font-body:    "Lora", "EB Garamond", Georgia, "Times New Roman", serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;

  --fs-xs:    0.8125rem;
  --fs-sm:    0.9375rem;
  --fs-base:  1.125rem;
  --fs-lg:    1.25rem;
  --fs-xl:    1.5rem;
  --fs-2xl:   1.875rem;
  --fs-3xl:   2.5rem;
  --fs-4xl:   3.25rem;
  --fs-5xl:   4.5rem;

  --lh-tight:  1.15;
  --lh-snug:   1.3;
  --lh-body:   1.7;
  --lh-loose:  1.9;

  --tracking-tight:  -0.01em;
  --tracking-normal: 0;
  --tracking-wide:   0.04em;
  --tracking-caps:   0.12em;

  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.25rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  --radius-none: 0;
  --radius-sm:   2px;
  --radius-md:   4px;
  --radius-lg:   6px;
  --radius-pill: 9999px;

  --shadow-page:  0 1px 0 rgba(60,45,25,0.06), 0 8px 24px -12px rgba(60,45,25,0.18);
  --shadow-card:  0 1px 2px rgba(60,45,25,0.08), 0 2px 8px -2px rgba(60,45,25,0.06);
  --shadow-inset: inset 0 1px 0 rgba(255,250,235,0.6), inset 0 -1px 0 rgba(60,45,25,0.05);

  --ease:          cubic-bezier(0.2,0.7,0.2,1);
  --duration:      200ms;
  --duration-slow: 320ms;
}

.bookish {
  font-family: var(--font-body);
  font-size: var(--fs-base);
  line-height: var(--lh-body);
  color: var(--fg);
  background: var(--bg);
  font-feature-settings: "kern","liga","onum";
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.bookish ::selection { background: var(--selection-bg); color: var(--ink); }

.bookish h1, .bookish h2, .bookish h3, .bookish h4 {
  font-family: var(--font-display);
  color: var(--ink);
  font-weight: 500;
  line-height: var(--lh-tight);
  letter-spacing: var(--tracking-tight);
  margin: 0 0 var(--space-6);
}
.bookish h1 { font-size: var(--fs-4xl); font-weight: 500; letter-spacing: -0.015em; }
.bookish h2 { font-size: var(--fs-3xl); font-weight: 500; }
.bookish h3 { font-size: var(--fs-2xl); font-weight: 500; }
.bookish h4 { font-size: var(--fs-xl); font-weight: 600; font-style: italic; }

.bookish hr {
  border: 0;
  text-align: center;
  margin: var(--space-12) 0;
  color: var(--rule);
}
.bookish hr::before {
  content: "❦";
  font-size: 1.25rem;
  color: var(--rule);
  letter-spacing: 1em;
}
```

- [ ] **Step 2: Create `src/app/app.css`**

```css
/* ============================================================================
   Ledger — app-specific component styles
   ============================================================================ */

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; background: var(--paper); }

.app {
  display: flex;
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
}
.app::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}

/* ----------------------------------------------------------------- Sidebar */
.sidebar {
  width: 248px;
  flex-shrink: 0;
  background: var(--paper-shade);
  border-right: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 2;
}
.sidebar__brand { padding: 30px 28px 22px; display: flex; flex-direction: column; gap: 3px; }
.sidebar__mark { font-family: var(--font-display); font-size: 30px; font-weight: 600; letter-spacing: -0.015em; line-height: 1; color: var(--ink); }
.sidebar__mark .stroke { color: var(--accent); }
.sidebar__tag { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faint); }
.sidebar__rule { height: 1px; background: var(--rule); margin: 0 28px; }

.nav { display: flex; flex-direction: column; padding: 18px 16px; gap: 2px; flex: 1; }
.nav__label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); padding: 0 12px 8px; }
.nav__item {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px; border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 16px;
  color: var(--ink-soft); cursor: pointer; border: none;
  background: transparent; text-align: left; width: 100%;
  text-decoration: none;
  transition: color var(--duration) var(--ease), background var(--duration) var(--ease);
  position: relative;
}
.nav__item:hover { color: var(--ink); background: rgba(139,44,29,0.04); }
.nav__item.active { color: var(--accent); }
.nav__item.active::before {
  content: ""; position: absolute; left: 0; top: 9px; bottom: 9px;
  width: 2px; background: var(--accent); border-radius: 2px;
}
.nav__item svg { flex-shrink: 0; }
.nav__num { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.02em; }

.sidebar__foot { padding: 16px; }
.btn-upload {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: 9px; padding: 11px 14px; background: var(--stone-800);
  color: var(--stone-50); border: 1px solid transparent;
  border-radius: var(--radius-md); font-family: var(--font-body);
  font-size: 15px; cursor: pointer; box-shadow: var(--shadow-inset);
  transition: background var(--duration) var(--ease);
}
.btn-upload:hover { background: var(--stone-700); }
.sidebar__sig { text-align: center; font-family: var(--font-display); font-style: italic; font-size: 13px; color: var(--ink-faint); padding: 4px 0 18px; }

/* -------------------------------------------------------------------- Main */
.main { flex: 1; min-width: 0; position: relative; z-index: 1; overflow-x: hidden; }
.page { max-width: 1040px; margin: 0 auto; padding: 40px 56px 80px; }

.chapter { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 6px; }
.chapter__eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; }
.chapter__title { font-family: var(--font-display); font-size: 46px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; margin: 0; color: var(--ink); }
.chapter__sub { font-family: var(--font-display); font-style: italic; font-size: 18px; color: var(--ink-faint); margin-top: 8px; }

.fleuron-rule { border: 0; height: 1px; background: var(--rule); margin: 26px 0 30px; position: relative; }
.fleuron-rule::after {
  content: "❦"; position: absolute; left: 50%; top: 50%;
  transform: translate(-50%,-50%); background: var(--paper);
  padding: 0 16px; color: var(--rule); font-size: 15px;
}

/* ----------------------------------------------------- Period toggle */
.toggle { display: inline-flex; border: 1px solid var(--rule); border-radius: var(--radius-md); overflow: hidden; background: var(--bg-elev); }
.toggle button { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 15px; border: none; background: transparent; color: var(--ink-faint); cursor: pointer; border-right: 1px solid var(--rule); transition: color var(--duration) var(--ease); }
.toggle button:last-child { border-right: none; }
.toggle button:hover { color: var(--ink-soft); }
.toggle button.on { background: var(--ink); color: var(--paper); }

/* ----------------------------------------------------------- Summary ledger */
.summary { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid var(--rule); border-radius: var(--radius-md); background: var(--bg-elev); box-shadow: var(--shadow-card); overflow: hidden; }
.summary__cell { padding: 20px 24px 22px; border-right: 1px solid var(--rule); }
.summary__cell:last-child { border-right: none; }
.summary__label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; }
.summary__value { font-family: var(--font-display); font-size: 38px; font-weight: 500; line-height: 1; letter-spacing: -0.01em; color: var(--ink); }
.summary__value .cur { font-size: 20px; color: var(--ink-faint); margin-right: 3px; }
.summary__value.accent { color: var(--accent); }
.summary__meta { margin-top: 9px; font-family: var(--font-display); font-style: italic; font-size: 14px; color: var(--ink-faint); }

/* ------------------------------------------------------------------- Panels */
.panel { background: var(--bg-elev); border: 1px solid var(--rule); border-radius: var(--radius-md); box-shadow: var(--shadow-card); padding: 22px 24px; }
.panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.panel__title { font-family: var(--font-display); font-size: 21px; font-weight: 500; color: var(--ink); margin: 0; white-space: nowrap; }
.panel__note { font-family: var(--font-mono); font-size: 12px; color: var(--ink-faint); letter-spacing: 0.02em; }

.grid-2 { display: grid; grid-template-columns: 1.85fr 1fr; gap: 22px; align-items: stretch; }

.seg { display: inline-flex; gap: 0; border: 1px solid var(--rule); border-radius: var(--radius-sm); overflow: hidden; }
.seg button { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 11px; border: none; border-right: 1px solid var(--rule); background: transparent; color: var(--ink-faint); cursor: pointer; transition: color var(--duration) var(--ease); }
.seg button:last-child { border-right: none; }
.seg button.on { background: var(--ink); color: var(--paper); }

/* ---------------------------------------------------------- Calendar ledger */
.cal__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cal__month { font-family: var(--font-display); font-size: 24px; font-weight: 500; color: var(--ink); min-width: 200px; }
.cal__nav { display: flex; align-items: center; gap: 8px; }
.cal__arrow { width: 30px; height: 30px; border: 1px solid var(--rule); background: var(--paper); color: var(--ink-soft); border-radius: var(--radius-sm); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all var(--duration) var(--ease); font-family: var(--font-display); }
.cal__arrow:hover { background: var(--paper-shade); color: var(--ink); }
.cal__total { font-family: var(--font-mono); font-size: 13px; color: var(--ink-soft); }
.cal__total b { color: var(--accent); font-weight: 500; }

.cal__dow { display: grid; grid-template-columns: 46px repeat(7,1fr); border-bottom: 1px solid var(--rule); }
.cal__dow span { text-align: center; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; color: var(--ink-faint); padding: 0 0 8px; }

.cal__row { display: grid; grid-template-columns: 46px repeat(7,1fr); border-bottom: 1px solid var(--rule-soft); }
.cal__week { display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; }
.cal__weekbar { background: var(--accent); opacity: 0.85; width: 7px; border-radius: 1px; }

.cal__cell { height: 78px; border-left: 1px solid var(--rule-soft); padding: 5px 6px; display: flex; flex-direction: column; align-items: center; position: relative; }
.cal__cell.out { background: repeating-linear-gradient(135deg,transparent,transparent 5px,rgba(201,191,169,0.10) 5px,rgba(201,191,169,0.10) 6px); }
.cal__daynum { align-self: flex-start; font-family: var(--font-mono); font-size: 10px; color: var(--ink-faint); line-height: 1; }
.cal__cell.today .cal__daynum { color: var(--paper); background: var(--ink); border-radius: var(--radius-pill); padding: 2px 5px; margin: -1px 0 0 -1px; }
.cal__dot { border-radius: var(--radius-pill); background: rgba(139,44,29,0.16); border: 1.4px solid var(--accent); margin: auto 0 2px; flex-shrink: 0; }
.cal__amt { font-family: var(--font-mono); font-size: 8.5px; color: var(--ink-faint); line-height: 1; padding-bottom: 2px; }
.cal__legend { display: flex; gap: 24px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--rule); font-family: var(--font-display); font-style: italic; font-size: 13px; color: var(--ink-faint); }
.cal__legend span { display: flex; align-items: center; gap: 8px; }

/* ------------------------------------------------------------------- Charts */
.legend-list { display: flex; flex-direction: column; gap: 0; margin-top: 18px; }
.legend-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--rule-soft); font-size: 15px; }
.legend-row:last-child { border-bottom: none; }
.legend-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.legend-name { flex: 1; color: var(--ink-soft); font-family: var(--font-body); }
.legend-pct { font-family: var(--font-mono); font-size: 13px; color: var(--ink); }
.donut-wrap { display: flex; flex-direction: column; align-items: center; }
.donut-center { font-family: var(--font-display); text-align: center; }
.donut-center .k { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); }
.donut-center .v { font-size: 24px; color: var(--ink); }

.empty { display: flex; align-items: center; justify-content: center; height: 240px; font-family: var(--font-display); font-style: italic; color: var(--ink-faint); font-size: 17px; }

/* --------------------------------------------------------------- Tables */
.filters { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }
.field input, .field select { font-family: var(--font-body); font-size: 15px; color: var(--ink); background: var(--bg-elev); border: 1px solid var(--rule); border-radius: var(--radius-sm); padding: 7px 11px; outline: none; transition: border-color var(--duration) var(--ease); }
.field input:focus, .field select:focus { border-color: var(--accent-soft); }
.field__count { margin-left: auto; font-family: var(--font-display); font-style: italic; font-size: 15px; color: var(--ink-faint); padding-bottom: 6px; }

.ledger-table-wrap { border: 1px solid var(--rule); border-radius: var(--radius-md); background: var(--bg-elev); box-shadow: var(--shadow-card); overflow: hidden; }
table.ledger { width: 100%; border-collapse: collapse; font-family: var(--font-body); }
table.ledger thead th { text-align: left; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); font-weight: 500; padding: 13px 18px; border-bottom: 1.5px solid var(--ink); background: var(--paper-shade); cursor: pointer; user-select: none; white-space: nowrap; }
table.ledger thead th.num { text-align: right; }
table.ledger thead th .sar { color: var(--accent); }
table.ledger thead th.static { cursor: default; }
table.ledger tbody td { padding: 12px 18px; border-bottom: 1px solid var(--rule-soft); font-size: 15px; color: var(--ink-soft); vertical-align: middle; }
table.ledger tbody tr:last-child td { border-bottom: none; }
table.ledger tbody tr { transition: background var(--duration) var(--ease); }
table.ledger tbody tr:hover { background: rgba(139,44,29,0.035); }
.td-date { font-family: var(--font-mono); font-size: 13px; color: var(--ink-faint); white-space: nowrap; }
.td-desc { color: var(--ink); max-width: 280px; }
.td-amt { font-family: var(--font-mono); font-size: 14px; text-align: right; white-space: nowrap; font-feature-settings: "tnum"; }
.td-amt.expense { color: var(--ink); }
.td-amt.credit { color: var(--success); }
.td-bank { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
.bank-tag { border: 1px solid var(--rule); border-radius: var(--radius-sm); padding: 2px 7px; background: var(--paper); }

.cat-edit { position: relative; }
.cat-btn { font-family: var(--font-body); font-size: 14px; color: var(--accent); background: transparent; border: none; border-bottom: 1px dashed var(--accent-soft); padding: 1px 1px 1px 0; cursor: pointer; }
.cat-btn:hover { color: var(--accent-soft); }
.cat-menu { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; min-width: 180px; background: var(--bg-elev); border: 1px solid var(--rule); border-radius: var(--radius-md); box-shadow: var(--shadow-page); padding: 5px; }
.cat-menu button { display: block; width: 100%; text-align: left; font-family: var(--font-body); font-size: 14px; color: var(--ink-soft); background: transparent; border: none; padding: 7px 10px; border-radius: var(--radius-sm); cursor: pointer; }
.cat-menu button:hover { background: var(--paper-shade); color: var(--ink); }
.cat-menu button.sel { color: var(--accent); }

/* --------------------------------------------------------------- Modal */
.overlay { position: fixed; inset: 0; background: rgba(31,26,20,0.34); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; animation: fade 200ms var(--ease); }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.modal { width: 100%; max-width: 480px; background: var(--bg-elev); border: 1px solid var(--rule); border-radius: var(--radius-md); box-shadow: var(--shadow-page); padding: 30px 32px 28px; position: relative; }
.modal__close { position: absolute; top: 18px; right: 18px; width: 28px; height: 28px; border: none; background: transparent; color: var(--ink-faint); cursor: pointer; font-size: 18px; border-radius: var(--radius-sm); }
.modal__close:hover { color: var(--accent); }
.modal__title { font-family: var(--font-display); font-size: 28px; font-weight: 500; margin: 0 0 4px; color: var(--ink); }
.modal__sub { font-family: var(--font-display); font-style: italic; font-size: 15px; color: var(--ink-faint); margin: 0 0 22px; }

.dropzone { border: 1.5px dashed var(--rule); border-radius: var(--radius-md); padding: 34px 20px; text-align: center; background: var(--paper); transition: all var(--duration) var(--ease); cursor: pointer; }
.dropzone.drag { border-color: var(--accent); background: rgba(139,44,29,0.04); }
.dropzone__icon { color: var(--ink-faint); margin-bottom: 12px; }
.dropzone__main { font-family: var(--font-display); font-size: 19px; color: var(--ink); }
.dropzone__hint { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--ink-faint); margin-top: 6px; }

.bank-pick { margin: 22px 0 8px; }
.bank-pick__label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; }
.bank-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
.bank-opt { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 10px 4px; border: 1px solid var(--rule); border-radius: var(--radius-sm); background: var(--paper); color: var(--ink-soft); cursor: pointer; transition: all var(--duration) var(--ease); }
.bank-opt:hover { border-color: var(--accent-soft); }
.bank-opt.on { background: var(--ink); color: var(--paper); border-color: var(--ink); }

.modal__actions { display: flex; gap: 10px; margin-top: 24px; }
.btn-primary { flex: 1; font-family: var(--font-body); font-size: 15px; padding: 11px; background: var(--accent); color: var(--paper); border: none; border-radius: var(--radius-md); cursor: pointer; box-shadow: var(--shadow-inset); transition: background var(--duration) var(--ease); }
.btn-primary:hover { background: var(--accent-soft); }
.btn-primary:disabled { background: var(--rule); color: var(--ink-faint); cursor: not-allowed; box-shadow: none; }
.btn-ghost { font-family: var(--font-body); font-size: 15px; padding: 11px 18px; background: transparent; color: var(--ink-soft); border: 1px solid var(--rule); border-radius: var(--radius-md); cursor: pointer; }
.btn-ghost:hover { background: var(--paper-shade); }

.parsing { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 30px 0 10px; }
.parsing__bar { width: 100%; height: 3px; background: var(--rule-soft); border-radius: 2px; overflow: hidden; }
.parsing__fill { height: 100%; background: var(--accent); transition: width 120ms linear; }
.parsing__txt { font-family: var(--font-display); font-style: italic; color: var(--ink-soft); }

.main::-webkit-scrollbar { width: 12px; }
.main::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 6px; border: 3px solid var(--paper); }
```

- [ ] **Step 3: Update `src/app/globals.css`**

```css
@import "tailwindcss";
@import "./bookish.css";
@import "./app.css";
```

- [ ] **Step 4: Run existing tests — confirm nothing broke**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && pnpm test
```

Expected: all tests pass (CSS changes don't affect logic tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/bookish.css src/app/app.css src/app/globals.css
git commit -m "feat: add bookish CSS foundation (tokens, components, layout)"
```

---

## Task 2: Layout structure and fonts

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Ledger",
  description: "Personal spending visualizer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="bookish">
        <div className="app">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update layout to use bookish class and app shell structure"
```

---

## Task 3: Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace `src/components/layout/Sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/storage";
import { UploadModal } from "@/components/modals/UploadModal";

export function Sidebar() {
  const pathname = usePathname();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [txCount, setTxCount] = useState(0);

  useEffect(() => {
    setTxCount(getTransactions().length);
    function refresh() {
      setTxCount(getTransactions().length);
    }
    window.addEventListener("ledger:updated", refresh);
    return () => window.removeEventListener("ledger:updated", refresh);
  }, []);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__mark">
            Ledger<span className="stroke">.</span>
          </div>
          <div className="sidebar__tag">a book of accounts</div>
        </div>
        <div className="sidebar__rule" />
        <nav className="nav">
          <div className="nav__label">Pages</div>
          <Link
            href="/dashboard"
            className={`nav__item${pathname === "/dashboard" ? " active" : ""}`}
          >
            <DashIcon />
            Overview
          </Link>
          <Link
            href="/transactions"
            className={`nav__item${pathname === "/transactions" ? " active" : ""}`}
          >
            <TxIcon />
            Transactions
            {txCount > 0 && <span className="nav__num">{txCount}</span>}
          </Link>
        </nav>
        <div className="sidebar__foot">
          <button
            type="button"
            className="btn-upload"
            onClick={() => setUploadOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Upload statement
          </button>
        </div>
        <div className="sidebar__sig">kept in a fair hand</div>
      </aside>
      <UploadModal open={uploadOpen} onCloseAction={() => setUploadOpen(false)} />
    </>
  );
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function TxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 4h12M2 8h9M2 12h11" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: restyle sidebar to bookish paper-and-ink design"
```

---

## Task 4: SummaryCards → SummaryLedger

**Files:**
- Modify: `src/components/dashboard/SummaryCards.tsx`

- [ ] **Step 1: Replace `src/components/dashboard/SummaryCards.tsx`**

```tsx
import { computeSummary } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const { totalExpense, transactionCount, topCategory } = computeSummary(transactions);
  const credits = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const net = credits - totalExpense;

  return (
    <div className="summary">
      <div className="summary__cell">
        <div className="summary__label">Total spent</div>
        <div className="summary__value accent">
          <span className="cur">Rp</span>
          {totalExpense.toLocaleString("id-ID")}
        </div>
        <div className="summary__meta">across {transactionCount} entries</div>
      </div>
      <div className="summary__cell">
        <div className="summary__label">Net position</div>
        <div className="summary__value">
          <span className="cur">Rp</span>
          {Math.abs(net).toLocaleString("id-ID")}
        </div>
        <div className="summary__meta">
          {net >= 0 ? "in the black" : "in the red"} after credits
        </div>
      </div>
      <div className="summary__cell">
        <div className="summary__label">Most frequent</div>
        <div className="summary__value" style={{ fontSize: 30 }}>
          {topCategory || "—"}
        </div>
        <div className="summary__meta">your busiest ledger line</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/SummaryCards.tsx
git commit -m "feat: restyle summary cards to ruled three-column ledger header"
```

---

## Task 5: PeriodToggle

**Files:**
- Modify: `src/components/dashboard/PeriodToggle.tsx`

- [ ] **Step 1: Replace `src/components/dashboard/PeriodToggle.tsx`**

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
  onChangeAction,
}: {
  value: Period;
  onChangeAction: (p: Period) => void;
}) {
  return (
    <div className="toggle">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? "on" : ""}
          onClick={() => onChangeAction(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/PeriodToggle.tsx
git commit -m "feat: restyle period toggle to bookish monospaced tab strip"
```

---

## Task 6: SpendingBarChart

**Files:**
- Modify: `src/components/dashboard/SpendingBarChart.tsx`

Only color constants change — swap three values.

- [ ] **Step 1: Update colors in `src/components/dashboard/SpendingBarChart.tsx`**

Find and replace these three values:

| Old | New |
|---|---|
| `"#4E82F7"` (bar fill) | `"#8b2c1d"` |
| `"rgba(255,255,255,0.05)"` (gridline stroke) | `"#e3d9c4"` |
| `"#3D4465"` (axis text fill, appears 3×) | `"#8a7e6e"` |

Also add `opacity="0.88"` to the bar rect:
```tsx
// was:
.attr("fill", "#4E82F7")
.attr("rx", 3);

// becomes:
.attr("fill", "#8b2c1d")
.attr("fill-opacity", 0.88)
.attr("rx", 1);
```

Also update the empty state:
```tsx
// was:
<div className="flex h-60 items-center justify-center text-sm text-zinc-400">
  No data yet — upload a statement to get started.
</div>

// becomes:
<div className="empty">Nothing recorded yet.</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/SpendingBarChart.tsx
git commit -m "feat: restyle spending bar chart to oxblood bookish palette"
```

---

## Task 7: FrequencyChart

**Files:**
- Modify: `src/components/dashboard/FrequencyChart.tsx`

- [ ] **Step 1: Update colors in `src/components/dashboard/FrequencyChart.tsx`**

| Old | New |
|---|---|
| `"#F5A623"` (line stroke, dot fill, appears 2×) | `"#8b2c1d"` |
| `"rgba(255,255,255,0.05)"` (gridline) | `"#e3d9c4"` |
| `"#3D4465"` (axis text, appears 3×) | `"#8a7e6e"` |

Also update dot fill opacity and background:
```tsx
// Dots — was fill "#F5A623", fill-opacity 0.9
.attr("fill", "#8b2c1d")
.attr("fill-opacity", 1);
```

Also update the empty state:
```tsx
// becomes:
<div className="empty">Nothing recorded yet.</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/FrequencyChart.tsx
git commit -m "feat: restyle frequency chart to oxblood bookish palette"
```

---

## Task 8: CategoryPieChart

**Files:**
- Modify: `src/components/dashboard/CategoryPieChart.tsx`

- [ ] **Step 1: Replace `src/components/dashboard/CategoryPieChart.tsx`**

```tsx
"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { CategorySpending } from "@/lib/types";

const COLORS = [
  "#8b2c1d",
  "#6f5b3e",
  "#4f6b3a",
  "#a3711b",
  "#b0533f",
  "#7c6a86",
  "#5e6b5a",
  "#9a8b6f",
];

function formatShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
  return `Rp ${amount}`;
}

export function CategoryPieChart({ data }: { data: CategorySpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 190;
    const radius = size / 2;
    const innerRadius = radius * 0.6;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", size)
      .attr("height", size)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<CategorySpending>()
      .value((d) => d.total)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<CategorySpending>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 2)
      .cornerRadius(1);

    const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#fbf7ee")
      .attr("stroke-width", 2);
  }, [data]);

  if (data.length === 0) {
    return <div className="empty">No categories yet.</div>;
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="donut-wrap">
      <div style={{ position: "relative" }}>
        <svg ref={svgRef} style={{ display: "block" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="donut-center">
            <div className="k">Total</div>
            <div className="v">{formatShort(total)}</div>
          </div>
        </div>
      </div>
      <div className="legend-list" style={{ width: "100%" }}>
        {data.slice(0, 6).map((d, i) => (
          <div className="legend-row" key={d.category}>
            <span
              className="legend-swatch"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="legend-name">{d.category}</span>
            <span className="legend-pct">
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
git commit -m "feat: restyle category donut to bookish muted palette with center total"
```

---

## Task 9: CalendarHeatmap

**Files:**
- Modify: `src/components/dashboard/CalendarHeatmap.tsx`

- [ ] **Step 1: Replace `src/components/dashboard/CalendarHeatmap.tsx`**

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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/CalendarHeatmap.tsx
git commit -m "feat: restyle calendar heatmap to bookish ruled ledger with oxblood ink"
```

---

## Task 10: Dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace `src/app/dashboard/page.tsx`**

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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add chapter heading, fleuron rule, and bookish panel structure to dashboard"
```

---

## Task 11: CategoryDropdown

**Files:**
- Modify: `src/components/transactions/CategoryDropdown.tsx`

- [ ] **Step 1: Replace `src/components/transactions/CategoryDropdown.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getCategories } from "@/lib/storage";

export function CategoryDropdown({
  value,
  onChangeAction,
}: {
  value: string;
  onChangeAction: (category: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories] = useState(() => getCategories());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span className="cat-edit" ref={ref}>
      <button
        type="button"
        className="cat-btn"
        onClick={() => setOpen((o) => !o)}
      >
        {value}
      </button>
      {open && (
        <div className="cat-menu">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={cat === value ? "sel" : ""}
              onClick={() => {
                onChangeAction(cat);
                setOpen(false);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transactions/CategoryDropdown.tsx
git commit -m "feat: restyle category dropdown to dashed-underline bookish edit button"
```

---

## Task 12: TransactionTable

**Files:**
- Modify: `src/components/transactions/TransactionTable.tsx`

- [ ] **Step 1: Replace `src/components/transactions/TransactionTable.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/types";
import { CategoryDropdown } from "./CategoryDropdown";

type SortKey = keyof Pick<Transaction, "date" | "description" | "amount" | "category" | "bank">;
type SortDir = "asc" | "desc";

function formatIDR(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("id-ID");
  return amount < 0 ? `-Rp ${abs}` : `+Rp ${abs}`;
}

function SortTh({
  col,
  label,
  num,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey;
  label: string;
  num?: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  const arrow = active ? (sortDir === "asc" ? "↑" : "↓") : "↕";
  return (
    <th
      className={num ? "num" : ""}
      onClick={() => onSort(col)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSort(col)}
      tabIndex={0}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}{" "}
      <span className={active ? "sar" : ""} style={{ opacity: active ? 1 : 0.35 }}>
        {arrow}
      </span>
    </th>
  );
}

export function TransactionTable({
  transactions,
  onCategoryChangeAction,
}: {
  transactions: Transaction[];
  onCategoryChangeAction: (id: string, category: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const categories = [
    "all",
    ...Array.from(new Set(transactions.map((t) => t.category))).sort(),
  ];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
    }
  }

  const filtered = transactions
    .filter((t) => filterCategory === "all" || t.category === filterCategory)
    .filter((t) => !filterStart || t.date >= filterStart)
    .filter((t) => !filterEnd || t.date <= filterEnd)
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div>
      <div className="filters">
        <div className="field">
          <label htmlFor="f-start">From</label>
          <input
            id="f-start"
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-end">To</label>
          <input
            id="f-end"
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="f-cat">Category</label>
          <select
            id="f-cat"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>
        <div className="field__count">{filtered.length} entries</div>
      </div>

      <div className="ledger-table-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <SortTh col="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="description" label="Description" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="category" label="Category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="bank" label="Bank" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh col="amount" label="Amount" num sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "44px",
                    fontStyle: "italic",
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-faint)",
                  }}
                >
                  No entries match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="td-date">{tx.date}</td>
                  <td className="td-desc">{tx.description}</td>
                  <td>
                    <CategoryDropdown
                      value={tx.category}
                      onChangeAction={(cat) => onCategoryChangeAction(tx.id, cat)}
                    />
                  </td>
                  <td>
                    <span className="td-bank">
                      <span className="bank-tag">{tx.bank}</span>
                    </span>
                  </td>
                  <td className={`td-amt ${tx.amount < 0 ? "expense" : "credit"}`}>
                    {formatIDR(tx.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transactions/TransactionTable.tsx
git commit -m "feat: restyle transaction table to ruled ledger with moss green credits"
```

---

## Task 13: Transactions page

**Files:**
- Modify: `src/app/transactions/page.tsx`

- [ ] **Step 1: Replace `src/app/transactions/page.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { getTransactions, saveTransactions } from "@/lib/storage";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    setTransactions(getTransactions());
    function refresh() {
      setTransactions(getTransactions());
    }
    window.addEventListener("ledger:updated", refresh);
    return () => window.removeEventListener("ledger:updated", refresh);
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveTransactions(transactions);
  }, [transactions]);

  function handleCategoryChange(id: string, category: string) {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category } : tx)),
    );
  }

  return (
    <div className="page">
      <div className="chapter">
        <div>
          <div className="chapter__eyebrow">Chapter II · The Day Book</div>
          <h1 className="chapter__title">Transactions</h1>
          <div className="chapter__sub">every entry, posted and dated</div>
        </div>
      </div>
      <hr className="fleuron-rule" />
      <TransactionTable
        transactions={transactions}
        onCategoryChangeAction={handleCategoryChange}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/transactions/page.tsx
git commit -m "feat: add chapter heading and fleuron rule to transactions page"
```

---

## Task 14: UploadModal

**Files:**
- Modify: `src/components/modals/UploadModal.tsx`

- [ ] **Step 1: Replace `src/components/modals/UploadModal.tsx`**

Keep all PDF parsing and API logic intact — only the JSX/styling changes.

```tsx
"use client";

import { useRef, useState } from "react";
import { deduplicateTransactions } from "@/lib/dedup";
import { getTransactions, saveTransactions } from "@/lib/storage";
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
    import.meta.url,
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
  onCloseAction,
}: {
  open: boolean;
  onCloseAction: () => void;
}) {
  const [bank, setBank] = useState<BankName>("bca");
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        setState({ status: "error", message: data.error ?? "API error", raw: data.raw });
        return;
      }
      parsed = data.transactions;
    } catch {
      setState({ status: "error", message: "Network error — please try again." });
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
    window.dispatchEvent(new CustomEvent("ledger:updated"));

    setState({ status: "done", added: newTransactions.length, duplicates: duplicateCount });
  }

  function handleClose() {
    setState({ status: "idle" });
    setSelectedFile(null);
    onCloseAction();
  }

  if (!open) return null;

  const isProcessing = state.status === "extracting" || state.status === "parsing";
  const progressSteps = ["Opening the statement…", "Reading entries…", "Sorting by category…", "Posting to the ledger…"];

  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Upload Statement"
    >
      <div className="modal">
        <button type="button" className="modal__close" onClick={handleClose} aria-label="Close">
          ✕
        </button>
        <h2 className="modal__title">Add to the ledger</h2>
        <p className="modal__sub">drop a bank statement and I'll post the entries</p>

        {isProcessing && (
          <div className="parsing">
            <div className="parsing__txt">
              {state.status === "extracting" ? progressSteps[0] : progressSteps[2]}
            </div>
            <div className="parsing__bar">
              <div className="parsing__fill" style={{ width: state.status === "extracting" ? "35%" : "75%" }} />
            </div>
          </div>
        )}

        {!isProcessing && state.status === "idle" && (
          <>
            <div
              className={`dropzone${dragging ? " drag" : ""}`}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) setSelectedFile(f);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="dropzone__icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
                </svg>
              </div>
              <div className="dropzone__main">
                {selectedFile ? selectedFile.name : "Drop a PDF here"}
              </div>
              <div className="dropzone__hint">
                {selectedFile ? "ready to post" : "or click to browse · PDF up to 10 MB"}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                }}
              />
            </div>

            <div className="bank-pick">
              <div className="bank-pick__label">Which bank?</div>
              <div className="bank-grid">
                {BANKS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    className={`bank-opt${bank === b.value ? " on" : ""}`}
                    onClick={() => setBank(b.value)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal__actions">
              <button type="button" className="btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!selectedFile}
                onClick={() => selectedFile && handleFile(selectedFile)}
              >
                Post entries
              </button>
            </div>
          </>
        )}

        {!isProcessing && state.status === "done" && (
          <div style={{ padding: "30px 0 10px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--success)", marginBottom: 8 }}>✓</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", margin: "0 0 4px" }}>
              {state.added} {state.added === 1 ? "entry" : "entries"} posted to the ledger.
            </p>
            {state.duplicates > 0 && (
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "var(--ink-faint)", margin: "0 0 20px" }}>
                {state.duplicates} duplicate{state.duplicates !== 1 ? "s" : ""} skipped.
              </p>
            )}
            <button type="button" className="btn-primary" style={{ maxWidth: 160, margin: "20px auto 0" }} onClick={handleClose}>
              Done
            </button>
          </div>
        )}

        {!isProcessing && state.status === "error" && (
          <div style={{ padding: "16px 0" }}>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--accent)", marginBottom: 12 }}>
              {state.message}
            </p>
            {state.raw && (
              <details style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                <summary style={{ cursor: "pointer" }}>View raw response</summary>
                <pre style={{ marginTop: 8, padding: 8, background: "var(--paper-shade)", borderRadius: "var(--radius-sm)", overflow: "auto", maxHeight: 160, fontSize: 11 }}>
                  {state.raw}
                </pre>
              </details>
            )}
            <div className="modal__actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => setState({ status: "idle" })}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/UploadModal.tsx
git commit -m "feat: restyle upload modal to bookish paper sheet with oxblood actions"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/IDSP34099/Documents/Personal/ledger && pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Run dev server and verify visually**

```bash
pnpm dev
```

Open `http://localhost:3000`. Check:
- Dashboard shows cream paper background, EB Garamond title, oxblood accent, fleuron rule
- Calendar shows oxblood circles and week bars, paper-shade cells
- Sidebar shows warm tan background with oxblood active indicator
- Transactions page shows ruled ledger table, moss green credits
- Upload modal shows paper background, dashed dropzone, bank grid buttons
- Period toggle in monospaced uppercase with ink-colored active state

- [ ] **Step 3: Type-check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Final commit if any fixes needed, then push**

```bash
git push -u origin feat/revamp-ledger
```
