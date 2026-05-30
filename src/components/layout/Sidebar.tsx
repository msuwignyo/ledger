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
