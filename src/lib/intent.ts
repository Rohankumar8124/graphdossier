/**
 * Chat intent classifier.
 *
 * Decides whether a message is a QUESTION about the records (→ GraphRAG) or a
 * GRAPH-EDIT command (→ the LangGraph editing agent). Structured output keeps
 * the decision machine-readable; an obvious-verb fast path skips the LLM call
 * for unmistakable edits, and any classifier failure falls back to Q&A — the
 * safe default, since edits mutate data.
 */
import { z } from "zod";
import { getChatModel } from "./gemini";

export type ChatIntent = "graph_edit" | "question";

const IntentSchema = z.object({
  intent: z
    .enum(["graph_edit", "question"])
    .describe(
      "graph_edit: the user wants to CHANGE the graph (create/delete/rename " +
        "nodes, add/remove links). question: the user is asking about the " +
        "documents or the graph's contents.",
    ),
  confidence: z.number().min(0).max(1).describe("Confidence 0–1."),
});

/** Unmistakable edit phrasing — cheap fast path, no LLM call needed. */
const OBVIOUS_EDIT =
  /\b(delete|remove|drop|rename|relabel|merge|connect|link|attach|disconnect|unlink|detach)\b.*\b(node|edge|relationship|link|connection)\b|\b(create|add)\s+(a\s+)?(node|edge|relationship|link|connection)\b/i;

export async function classifyIntent(message: string): Promise<ChatIntent> {
  if (OBVIOUS_EDIT.test(message)) return "graph_edit";
  try {
    const model = getChatModel({ temperature: 0 });
    const structured = model.withStructuredOutput(IntentSchema, {
      name: "classify_intent",
    });
    const result = await structured.invoke([
      {
        role: "system",
        content:
          "Classify the user's message for an investigative knowledge-graph " +
          "tool. Only classify as graph_edit when the user clearly asks to " +
          "modify the graph itself.",
      },
      { role: "user", content: message },
    ]);
    return result.confidence >= 0.6 ? result.intent : "question";
  } catch {
    return "question"; // safe default: never mutate on a guess
  }
}
