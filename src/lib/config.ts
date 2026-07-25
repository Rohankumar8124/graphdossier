/**
 * Typed, validated environment configuration.
 *
 * All secrets and connection details live in env vars (see `.env.example`).
 * Importing `config` from server code guarantees the required vars are present
 * and well-formed, failing fast with a readable error otherwise.
 */
import { z } from "zod";

const schema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_CHAT_MODEL: z.string().default("gemini-2.0-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),

  /** Directory for the embedded Kùzu database (created on first run). */
  KUZU_DB_PATH: z.string().default("data/graphdossier.kuzu"),
});

/** Parsed lazily so that non-server code (and tests) don't crash on import. */
let cached: z.infer<typeof schema> | null = null;

export function getConfig(): z.infer<typeof schema> {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the values.`,
    );
  }
  cached = parsed.data;
  return cached;
}
