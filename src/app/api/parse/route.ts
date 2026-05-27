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
      { status: 500 },
    );
  }

  let body: { text: string; bank: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
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
      return NextResponse.json(
        { error: "Unexpected response type from Claude" },
        { status: 500 },
      );
    }

    let transactions: unknown;
    try {
      transactions = JSON.parse(rawContent.text);
    } catch {
      return NextResponse.json(
        { error: "Claude returned malformed JSON", raw: rawContent.text },
        { status: 422 },
      );
    }

    return NextResponse.json({ transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
