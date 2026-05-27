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
