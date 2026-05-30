"use client";

import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isProcessing = state.status === "extracting" || state.status === "parsing";
  const progressSteps = ["Opening the statement…", "Reading entries…", "Sorting by category…", "Posting to the ledger…"];

  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
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
