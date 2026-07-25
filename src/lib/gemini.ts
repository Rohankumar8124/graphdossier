/**
 * Gemini clients — the only LLM provider in Graphdossier.
 *
 * Chat model powers extraction and GraphRAG answering; the embeddings model
 * powers the vector index used for retrieval. Both read their key/model from
 * the validated `config`.
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { getConfig } from "./config";

/**
 * Chat model factory. A fresh instance per call keeps streaming/temperature
 * settings isolated (e.g. deterministic extraction vs. conversational chat).
 */
export function getChatModel(opts?: {
  temperature?: number;
  streaming?: boolean;
}): ChatGoogleGenerativeAI {
  const cfg = getConfig();
  return new ChatGoogleGenerativeAI({
    apiKey: cfg.GEMINI_API_KEY,
    model: cfg.GEMINI_CHAT_MODEL,
    temperature: opts?.temperature ?? 0,
    streaming: opts?.streaming ?? false,
    maxOutputTokens: 4096,
  });
}

let embeddingsSingleton: GoogleGenerativeAIEmbeddings | null = null;

export function getEmbeddings(): GoogleGenerativeAIEmbeddings {
  if (embeddingsSingleton) return embeddingsSingleton;
  const cfg = getConfig();
  embeddingsSingleton = new GoogleGenerativeAIEmbeddings({
    apiKey: cfg.GEMINI_API_KEY,
    model: cfg.GEMINI_EMBEDDING_MODEL,
  });
  return embeddingsSingleton;
}

/**
 * The embedding dimension is *measured at runtime* the first time it's needed,
 * never hardcoded — different Gemini embedding models emit different widths.
 */
let measuredDimension: number | null = null;

export async function getEmbeddingDimension(): Promise<number> {
  if (measuredDimension) return measuredDimension;
  const probe = await getEmbeddings().embedQuery("dimension probe");
  measuredDimension = probe.length;
  return measuredDimension;
}

/**
 * Google's free-tier Gemini quota is tiny (as low as 20 requests/day for some
 * models) and shared across every visitor to a public demo — it trips far
 * more often than a real outage would. Surface it as an expected "the demo is
 * popular right now" state rather than a raw SDK stack trace.
 */
export function friendlyErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/429|quota|rate.?limit/i.test(raw)) {
    return (
      "This demo runs on a free Gemini API tier with a small shared daily " +
      "request limit, and it's been hit. Please try again in a minute — " +
      "or shortly after midnight Pacific, when the quota resets."
    );
  }
  return "Something went wrong answering that. Please try again.";
}
