/**
 * Neo4j graph layer: driver singleton, schema/constraints, and the vector
 * index used for GraphRAG retrieval.
 */
import neo4j, { Driver } from "neo4j-driver";
import { getConfig } from "./config";
import { getEmbeddingDimension } from "./gemini";
import { NODE_TYPES } from "./ontology";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (driver) return driver;
  const cfg = getConfig();
  driver = neo4j.driver(
    cfg.NEO4J_URI,
    neo4j.auth.basic(cfg.NEO4J_USERNAME, cfg.NEO4J_PASSWORD),
  );
  return driver;
}

/** Run a Cypher statement against the configured database. */
export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const cfg = getConfig();
  const session = getDriver().session({ database: cfg.NEO4J_DATABASE });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}

export const VECTOR_INDEX = "document_embeddings";

/**
 * Create uniqueness constraints and the document vector index.
 * Idempotent — safe to call before every ingestion run. The vector dimension
 * is measured from the live embedding model, never hardcoded.
 */
export async function ensureSchema(): Promise<void> {
  // One uniqueness constraint per node label keyed on `id`.
  for (const label of NODE_TYPES) {
    await runQuery(
      `CREATE CONSTRAINT ${constraintName(label)} IF NOT EXISTS
       FOR (n:${label}) REQUIRE n.id IS UNIQUE`,
    );
  }

  const dimension = await getEmbeddingDimension();
  await runQuery(
    `CREATE VECTOR INDEX ${VECTOR_INDEX} IF NOT EXISTS
     FOR (d:Document) ON (d.embedding)
     OPTIONS { indexConfig: {
       \`vector.dimensions\`: $dimension,
       \`vector.similarity_function\`: 'cosine'
     } }`,
    { dimension: neo4j.int(dimension) },
  );
}

function constraintName(label: string): string {
  return `constraint_${label.toLowerCase()}_id`;
}

/** Wipe all Graphdossier data — used by the ingestion script's `--reset` flag. */
export async function resetGraph(): Promise<void> {
  await runQuery(`MATCH (n) DETACH DELETE n`);
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
