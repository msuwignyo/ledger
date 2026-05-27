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
      <aside
        className="w-52 flex flex-col shrink-0 min-h-screen"
        style={{
          background: "#07090e",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-7 pb-8 flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#F5A623", color: "#07090e" }}
          >
            L
          </div>
          <span
            className="font-semibold tracking-tight text-base"
            style={{ color: "#E4E8F5" }}
          >
            Ledger
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-3 flex-1">
          <NavLink href="/dashboard" active={pathname === "/dashboard"}>
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink href="/transactions" active={pathname === "/transactions"}>
            <TransactionsIcon />
            Transactions
          </NavLink>
        </nav>

        {/* Upload button */}
        <div className="px-3 pb-6">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "#F5A623", color: "#07090e" }}
          >
            <span className="text-base leading-none">+</span>
            Upload PDF
          </button>
        </div>
      </aside>

      <UploadModal
        open={uploadOpen}
        onCloseAction={() => setUploadOpen(false)}
      />
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
      style={
        active
          ? {
              background: "rgba(245,166,35,0.12)",
              color: "#F5A623",
            }
          : {
              color: "rgba(228,232,245,0.45)",
            }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "rgba(228,232,245,0.75)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "rgba(228,232,245,0.45)";
      }}
    >
      {children}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="6"
        height="6"
        rx="1"
        fill="currentColor"
        opacity="0.9"
      />
      <rect
        x="8"
        y="1"
        width="6"
        height="6"
        rx="1"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="1"
        y="8"
        width="6"
        height="6"
        rx="1"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="8"
        y="8"
        width="6"
        height="6"
        rx="1"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 3.5h13M1 7.5h9M1 11.5h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
