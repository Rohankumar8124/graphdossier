/**
 * Graph operations service layer.
 *
 * The single place where node/edge mutations are implemented. Both the public
 * REST endpoints (`/api/nodes`, `/api/edges`) and the chat agent's tools call
 * these functions, so the agent can do exactly what the API can do — nothing
 * more — and every path enforces the same schema rules.
 */
import { runQuery } from "./graphdb";
import {
  NODE_TYPES,
  ALLOWED_TRIPLES,
  type NodeType,
  type RelationshipType,
} from "./graph-schema";

const TRIPLES = new Set(ALLOWED_TRIPLES.map(([s, r, t]) => `${s}|${r}|${t}`));

/** Lowercase, strip honorifics/punctuation, collapse whitespace. */
export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|sir|hon)\.?\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Canonical id policy: `Type:slug(name)` (documents/redactions are doc-scoped). */
export function canonicalId(
  type: NodeType,
  name: string,
  docId?: string,
): string {
  if (type === "Document" && docId) return `Document:${docId}`;
  if (type === "RedactedSpan" && docId)
    return `RedactedSpan:${docId}:${slug(name) || "span"}`;
  return `${type}:${slug(name)}`;
}

/** Parse the node type out of a canonical id (`Type:slug…`). */
export function typeOfId(id: string): NodeType | null {
  const prefix = id.split(":")[0];
  return (NODE_TYPES as readonly string[]).includes(prefix)
    ? (prefix as NodeType)
    : null;
}

export interface NodeSummary {
  id: string;
  type: NodeType;
  name: string;
}

/** Search nodes by (partial) name or id, optionally restricted to one type. */
export async function findNodes(
  query: string,
  type?: NodeType,
  limit = 12,
): Promise<NodeSummary[]> {
  const labels = type ? [type] : [...NODE_TYPES];
  const rows: NodeSummary[] = [];
  for (const label of labels) {
    const found = await runQuery<{ id: string; name: string }>(
      `MATCH (n:${label})
       WHERE lower(n.name) CONTAINS lower($q) OR lower(n.id) CONTAINS lower($q)
       RETURN n.id AS id, coalesce(n.name, n.id) AS name LIMIT ${limit}`,
      { q: query },
    );
    rows.push(...found.map((f) => ({ ...f, type: label as NodeType })));
    if (rows.length >= limit) break;
  }
  return rows.slice(0, limit);
}

/** Create (or upsert) a node. Returns its canonical id. */
export async function createNode(
  type: NodeType,
  name: string,
): Promise<NodeSummary> {
  const id = canonicalId(type, name);
  await runQuery(`MERGE (n:${type} {id: $id}) SET n.name = $name`, {
    id,
    name,
  });
  return { id, type, name };
}

/** Rename a node by exact id. Throws if the id is malformed. */
export async function renameNode(id: string, newName: string): Promise<void> {
  const t = typeOfId(id);
  if (!t) throw new Error(`Invalid node id "${id}".`);
  await runQuery(`MATCH (n:${t} {id: $id}) SET n.name = $newName`, {
    id,
    newName,
  });
}

/** Delete a node and all of its relationships by exact id. */
export async function deleteNode(id: string): Promise<void> {
  const t = typeOfId(id);
  if (!t) throw new Error(`Invalid node id "${id}".`);
  await runQuery(`MATCH (n:${t} {id: $id}) DETACH DELETE n`, { id });
}

/**
 * Create a relationship between two nodes. Rejects triples the schema does
 * not allow, reporting what *is* allowed for that pair.
 */
export async function createEdge(
  sourceId: string,
  relationship: RelationshipType,
  targetId: string,
): Promise<void> {
  const s = typeOfId(sourceId);
  const t = typeOfId(targetId);
  if (!s || !t) throw new Error("Invalid node id.");
  if (!TRIPLES.has(`${s}|${relationship}|${t}`)) {
    const allowed = ALLOWED_TRIPLES.filter(([a, , b]) => a === s && b === t).map(
      ([, r]) => r,
    );
    throw new Error(
      `Schema violation: (${s})-[${relationship}]->(${t}) is not allowed.` +
        (allowed.length
          ? ` Allowed from ${s} to ${t}: ${allowed.join(", ")}.`
          : ` No relationship type is allowed from ${s} to ${t}.`),
    );
  }
  await runQuery(
    `MATCH (s:${s} {id: $sourceId}), (t:${t} {id: $targetId})
     MERGE (s)-[r:${relationship}]->(t)`,
    { sourceId, targetId },
  );
}

/** Delete a specific relationship between two nodes. */
export async function deleteEdge(
  sourceId: string,
  relationship: RelationshipType,
  targetId: string,
): Promise<void> {
  const s = typeOfId(sourceId);
  const t = typeOfId(targetId);
  if (!s || !t) throw new Error("Invalid node id.");
  await runQuery(
    `MATCH (s:${s} {id: $sourceId})-[r:${relationship}]->(t:${t} {id: $targetId})
     DELETE r`,
    { sourceId, targetId },
  );
}
