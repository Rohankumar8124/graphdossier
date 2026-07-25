/**
 * Graph layer on Kùzu — an embedded, file-based property-graph database.
 *
 * No server to run: the database lives in a local directory (KUZU_DB_PATH).
 * Node and relationship tables are generated from the typed graph schema in
 * `graph-schema.ts`, so the database enforces the same contract the extractor
 * and the UI use. Document embeddings are stored on the Document table and
 * ranked in TypeScript (cosine) — no external vector index needed.
 */
import { Database, Connection, QueryResult, type KuzuValue } from "kuzu";
import { getConfig } from "./config";
import { NODE_TYPES, ALLOWED_TRIPLES } from "./graph-schema";

let db: Database | null = null;
let conn: Connection | null = null;

function getConnection(): Connection {
  if (conn) return conn;
  const cfg = getConfig();
  db = new Database(cfg.KUZU_DB_PATH);
  conn = new Connection(db);
  return conn;
}

/** Run a Cypher statement, with optional named parameters. */
export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const c = getConnection();
  let result: QueryResult;
  if (Object.keys(params).length === 0) {
    result = (await c.query(cypher)) as QueryResult;
  } else {
    const stmt = await c.prepare(cypher);
    result = (await c.execute(
      stmt,
      params as Record<string, KuzuValue>,
    )) as QueryResult;
  }
  const rows = (await result.getAll()) as T[];
  result.close();
  return rows;
}

/**
 * Shared property columns for every node table; Document carries the extra
 * retrieval fields. The embedding is stored as a JSON string and ranked in
 * TypeScript, which keeps the schema portable.
 */
const COMMON_COLUMNS =
  "id STRING PRIMARY KEY, name STRING, role STRING, email STRING, " +
  "date STRING, docType STRING, exemptionCode STRING, redactionContext STRING";

const DOCUMENT_EXTRAS =
  ", title STRING, text STRING, source STRING, embedding STRING";

/**
 * Create the node and relationship tables from the graph schema.
 * Idempotent — safe to call before every ingestion run.
 */
export async function ensureSchema(): Promise<void> {
  for (const label of NODE_TYPES) {
    const extras = label === "Document" ? DOCUMENT_EXTRAS : "";
    await runQuery(
      `CREATE NODE TABLE IF NOT EXISTS ${label}(${COMMON_COLUMNS}${extras})`,
    );
  }

  // One relationship table per type, with every allowed (from, to) pair.
  const pairsByRel = new Map<string, string[]>();
  for (const [s, r, t] of ALLOWED_TRIPLES) {
    const pairs = pairsByRel.get(r) ?? [];
    pairs.push(`FROM ${s} TO ${t}`);
    pairsByRel.set(r, pairs);
  }
  for (const [rel, pairs] of pairsByRel) {
    await runQuery(`CREATE REL TABLE IF NOT EXISTS ${rel}(${pairs.join(", ")})`);
  }
}

/** Wipe all Graphdossier data — used by the ingestion script's `--reset` flag. */
export async function resetGraph(): Promise<void> {
  await runQuery(`MATCH (n) DETACH DELETE n`);
}

/** Cosine similarity between two equal-length vectors. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function closeGraph(): Promise<void> {
  conn = null;
  db = null;
}
