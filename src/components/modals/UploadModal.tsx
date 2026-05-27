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

    let parsed: {
      date: string;
      description: string;
      amount: number;
      category: string;
    }[];
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
    const { newTransactions, duplicateCount } = deduplicateTransactions(
      existing,
      incoming,
    );
    saveTransactions([...existing, ...newTransactions]);

    setState({
      status: "done",
      added: newTransactions.length,
      duplicates: duplicateCount,
    });
  }

  function handleClose() {
    setState({ status: "idle" });
    onCloseAction();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload Statement"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Upload Statement
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-xl leading-none text-zinc-400 hover:text-zinc-600"
          >
            ×
          </button>
        </div>

        {state.status === "idle" && (
          <>
            <div className="mb-4">
              <label
                htmlFor="bank-select"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Bank
              </label>
              <select
                id="bank-select"
                value={bank}
                onChange={(e) => setBank(e.target.value as BankName)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {BANKS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => inputRef.current?.click()}
              className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                dragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-zinc-300 hover:border-zinc-400"
              }`}
            >
              <p className="text-sm text-zinc-500">
                Drag & drop a PDF here, or click to select
              </p>
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
            </button>
          </>
        )}

        {(state.status === "extracting" || state.status === "parsing") && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-zinc-600">
              {state.status === "extracting"
                ? "Extracting text from PDF..."
                : "Asking Claude to find transactions..."}
            </p>
          </div>
        )}

        {state.status === "done" && (
          <div className="py-6 text-center">
            <p className="mb-2 text-2xl">✓</p>
            <p className="font-medium text-zinc-800">
              {state.added} transaction{state.added !== 1 ? "s" : ""} added.
            </p>
            {state.duplicates > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                {state.duplicates} duplicate{state.duplicates !== 1 ? "s" : ""}{" "}
                skipped.
              </p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        )}

        {state.status === "error" && (
          <div className="py-4">
            <p className="mb-2 text-sm font-medium text-red-600">
              {state.message}
            </p>
            {state.raw && (
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer">View raw response</summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-100 p-2">
                  {state.raw}
                </pre>
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
