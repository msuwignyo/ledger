import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a financial data extractor. The user will provide raw text extracted from an Indonesian bank statement PDF. Extract all debit/credit transactions and call the extract_transactions tool with the results.

Rules:
- Skip header rows, balance summaries, and non-transaction lines
- For transfers, use the recipient/sender name as description
- Infer category from the description (e.g. Grab/Gojek = Transport, Indomaret/Alfamart = Groceries)
- Amounts are in IDR: negative for expenses/debits, positive for credits/refunds`;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_transactions",
  description: "Return all transactions extracted from the bank statement",
  input_schema: {
    type: "object",
    properties: {
      transactions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "ISO 8601 date, e.g. 2026-04-15",
            },
            description: {
              type: "string",
              description: "Merchant name or transaction description",
            },
            amount: {
              type: "number",
              description: "Negative for debits, positive for credits, in IDR",
            },
            category: {
              type: "string",
              enum: [
                "Dining",
                "Groceries",
                "Transport",
                "Shopping",
                "Bills & Utilities",
                "Health",
                "Entertainment",
                "Travel",
                "Other",
              ],
            },
          },
          required: ["date", "description", "amount", "category"],
        },
      },
    },
    required: ["transactions"],
  },
};

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
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Claude did not call the extraction tool" },
        { status: 422 },
      );
    }

    const { transactions } = toolUse.input as { transactions: unknown };
    return NextResponse.json({ transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
