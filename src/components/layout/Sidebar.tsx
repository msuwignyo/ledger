"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteSource, getDisabledSources, getTransactions, saveDisabledSources } from "@/lib/storage";
import type { BankName } from "@/lib/types";
import { UploadModal } from "@/components/modals/UploadModal";

type SourceEntry = { sourceFile: string; bank: BankName; count: number };

function deriveSources(txs: ReturnType<typeof getTransactions>): SourceEntry[] {
  const map: Record<string, SourceEntry> = {};
  for (const tx of txs) {
    if (!map[tx.sourceFile]) {
      map[tx.sourceFile] = { sourceFile: tx.sourceFile, bank: tx.bank, count: 0 };
    }
    map[tx.sourceFile].count++;
  }
  return Object.values(map).sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
}

export function Sidebar() {
  const pathname = usePathname();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [txCount, setTxCount] = useState(0);
  const [sources, setSources] = useState<SourceEntry[]>([]);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());

  useEffect(() => {
    const txs = getTransactions();
    setTxCount(txs.length);
    setSources(deriveSources(txs));
    setDisabled(getDisabledSources());
    function refresh() {
      const updated = getTransactions();
      setTxCount(updated.length);
      setSources(deriveSources(updated));
      setDisabled(getDisabledSources());
    }
    window.addEventListener("ledger:updated", refresh);
    return () => window.removeEventListener("ledger:updated", refresh);
  }, []);

  function handleToggle(sourceFile: string) {
    const next = new Set(disabled);
    if (next.has(sourceFile)) next.delete(sourceFile);
    else next.add(sourceFile);
    saveDisabledSources(next);
    setDisabled(next);
    window.dispatchEvent(new CustomEvent("ledger:updated"));
  }

  function handleDelete(sourceFile: string) {
    deleteSource(sourceFile);
    window.dispatchEvent(new CustomEvent("ledger:updated"));
  }

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
        <div className="sources">
          <div className="sources__label">Data sources</div>
          {sources.length === 0 ? (
            <div className="sources__empty">No statements yet</div>
          ) : (
            sources.map((s) => {
              const isOff = disabled.has(s.sourceFile);
              return (
                <div className={`sources__item${isOff ? " off" : ""}`} key={s.sourceFile} title={s.sourceFile}>
                  <button
                    type="button"
                    className="sources__toggle"
                    onClick={() => handleToggle(s.sourceFile)}
                    aria-label={isOff ? "Enable source" : "Disable source"}
                  >
                    {isOff ? <ToggleOff /> : <ToggleOn />}
                  </button>
                  <span className="sources__bank">{s.bank.toUpperCase()}</span>
                  <span className="sources__file">{s.sourceFile.replace(/\.pdf$/i, "")}</span>
                  <span className="sources__count">{s.count}</span>
                  <button
                    type="button"
                    className="sources__delete"
                    onClick={() => handleDelete(s.sourceFile)}
                    aria-label="Remove source"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
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

function ToggleOn() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="7" r="2.5" fill="currentColor" />
    </svg>
  );
}

function ToggleOff() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    </svg>
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
