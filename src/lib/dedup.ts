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
