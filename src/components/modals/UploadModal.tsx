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
    window.dispatchEvent(new CustomEvent("ledger:updated"));

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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          background: "#111722",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "#E4E8F5" }}>
            Upload Statement
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-xl leading-none transition-colors"
            style={{ color: "#3D4465" }}
          >
            ×
          </button>
        </div>

        {state.status === "idle" && (
          <>
            <div className="mb-4">
              <label
                htmlFor="bank-select"
                className="mb-1.5 block text-xs uppercase tracking-wider font-medium"
                style={{ color: "#3D4465" }}
              >
                Bank
              </label>
              <select
                id="bank-select"
                value={bank}
                onChange={(e) => setBank(e.target.value as BankName)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  background: "#192030",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9AA0BE",
                }}
              >
                {BANKS.map((b) => (
                  <option
                    key={b.value}
                    value={b.value}
                    style={{ background: "#192030" }}
                  >
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
              className="w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all"
              style={
                dragging
                  ? {
                      borderColor: "#F5A623",
                      background: "rgba(245,166,35,0.07)",
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.08)",
                      background: "transparent",
                    }
              }
            >
              <p className="text-sm" style={{ color: "#5C6280" }}>
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
            <div
              className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "#F5A623", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "#5C6280" }}>
              {state.status === "extracting"
                ? "Extracting text from PDF..."
                : "Asking Claude to find transactions..."}
            </p>
          </div>
        )}

        {state.status === "done" && (
          <div className="py-6 text-center">
            <p
              className="mb-2 text-2xl font-mono font-bold"
              style={{ color: "#4ADE80" }}
            >
              ✓
            </p>
            <p className="font-medium" style={{ color: "#C8CCDF" }}>
              {state.added} transaction{state.added !== 1 ? "s" : ""} added.
            </p>
            {state.duplicates > 0 && (
              <p className="mt-1 text-sm" style={{ color: "#5C6280" }}>
                {state.duplicates} duplicate
                {state.duplicates !== 1 ? "s" : ""} skipped.
              </p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 rounded-lg px-6 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#F5A623", color: "#07090e" }}
            >
              Done
            </button>
          </div>
        )}

        {state.status === "error" && (
          <div className="py-4">
            <p
              className="mb-2 text-sm font-medium"
              style={{ color: "#F87171" }}
            >
              {state.message}
            </p>
            {state.raw && (
              <details className="text-xs" style={{ color: "#5C6280" }}>
                <summary className="cursor-pointer">View raw response</summary>
                <pre
                  className="mt-2 max-h-40 overflow-auto rounded-lg p-2 text-xs"
                  style={{
                    background: "#0F1520",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {state.raw}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={() => setState({ status: "idle" })}
              className="mt-4 text-sm underline"
              style={{ color: "#F5A623" }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
