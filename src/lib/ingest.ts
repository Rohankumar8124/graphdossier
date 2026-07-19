/**
 * Ingestion: extract → resolve entities → embed → write to Neo4j.
 *
 * Entity resolution is deliberately simple and deterministic: an entity's
 * canonical id is `type:slug(name)`, so the same normalized name appearing in
 * many documents collapses to one node. Gemini already unifies aliases *within*
 * a document; this catches repeats *across* the corpus.
 */
import { extractFromDocument, type ExtractedEntity } from "./extraction";
import { getEmbeddings } from "./gemini";
import { runQuery } from "./neo4j";
import { ALLOWED_TRIPLES, type NodeType } from "./ontology";

export interface DocInput {
  /** Stable id, typically the source filename without extension. */
  id: string;
  title: string;
  text: string;
  date?: string;
  source?: string;
}

export type IngestStage =
  | "extract"
  | "resolve"
  | "embed"
  | "write-nodes"
  | "write-edges";

/** A live progress event emitted while a document moves through the pipeline. */
export interface IngestProgress {
  stage: IngestStage;
  message: string;
  /** Completed units within the stage, when the stage is countable. */
  current?: number;
  total?: number;
}

export type IngestProgressFn = (p: IngestProgress) => void;

/** Lowercase, strip honorifics/punctuation, collapse whitespace. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|sir|hon)\.?\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function canonicalId(type: NodeType, name: string, docId: string): string {
  // The document itself gets the caller-provided stable id; everything else is
  // resolved by normalized name so cross-document mentions merge.
  if (type === "Document") return `Document:${docId}`;
  // Redactions are intentionally NOT merged across documents — each blackout is
  // its own lead — so they are scoped to the document and their slug.
  if (type === "RedactedSpan")
    return `RedactedSpan:${docId}:${slug(name) || "span"}`;
  return `${type}:${slug(name)}`;
}

const TRIPLE_SET = new Set(ALLOWED_TRIPLES.map(([s, r, t]) => `${s}|${r}|${t}`));

function entityProps(e: ExtractedEntity): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (e.role) p.role = e.role;
  if (e.email) p.email = e.email;
  if (e.date) p.date = e.date;
  if (e.docType) p.docType = e.docType;
  if (e.exemptionCode) p.exemptionCode = e.exemptionCode;
  if (e.redactionContext) p.redactionContext = e.redactionContext;
  return p;
}

/** Run the full pipeline for one document. Returns a small ingest summary. */
export async function ingestDocument(
  doc: DocInput,
  onProgress?: IngestProgressFn,
): Promise<{
  nodes: number;
  edges: number;
  redactions: number;
}> {
  onProgress?.({
    stage: "extract",
    message: "Extracting entities, relationships, and redactions with Gemini…",
  });
  const extraction = await extractFromDocument({
    text: doc.text,
    title: doc.title,
    date: doc.date,
  });

  onProgress?.({
    stage: "resolve",
    message: `Resolving ${extraction.entities.length} entities to canonical ids…`,
    total: extraction.entities.length,
  });
  // Map each tempId -> { id, type, name } resolving to canonical ids.
  const byTempId = new Map<
    string,
    { id: string; type: NodeType; name: string; props: Record<string, unknown> }
  >();
  for (const e of extraction.entities) {
    const id = canonicalId(e.type, e.name, doc.id);
    byTempId.set(e.tempId, {
      id,
      type: e.type,
      name: e.name,
      props: entityProps(e),
    });
  }

  // Ensure a Document node exists even if the model forgot to emit one.
  const docNodeId = `Document:${doc.id}`;
  const hasDocNode = [...byTempId.values()].some((v) => v.id === docNodeId);
  onProgress?.({
    stage: "embed",
    message: "Embedding document for vector search…",
  });
  const embedding = await getEmbeddings().embedQuery(
    `${doc.title}\n\n${doc.text}`.slice(0, 8000),
  );

  // Write nodes. Document gets the embedding + raw text for retrieval.
  const nodeTotal = byTempId.size + (hasDocNode ? 0 : 1);
  let nodesWritten = 0;
  for (const v of byTempId.values()) {
    if (v.id === docNodeId) {
      await writeDocumentNode(v.id, v.name, doc, embedding, v.props);
    } else {
      await writeNode(v.type, v.id, v.name, v.props);
    }
    nodesWritten++;
    onProgress?.({
      stage: "write-nodes",
      message: `Writing ${v.name} to Neo4j`,
      current: nodesWritten,
      total: nodeTotal,
    });
  }
  if (!hasDocNode) {
    await writeDocumentNode(docNodeId, doc.title, doc, embedding, {});
    nodesWritten++;
    onProgress?.({
      stage: "write-nodes",
      message: `Writing ${doc.title} to Neo4j`,
      current: nodesWritten,
      total: nodeTotal,
    });
  }

  // Write edges, dropping any that violate the ontology triple set.
  const edgeTotal = extraction.relationships.length;
  let edges = 0;
  let edgesSeen = 0;
  for (const r of extraction.relationships) {
    edgesSeen++;
    const s = byTempId.get(r.sourceTempId);
    const t = byTempId.get(r.targetTempId);
    if (!s || !t) continue;
    if (!TRIPLE_SET.has(`${s.type}|${r.type}|${t.type}`)) continue;
    await writeEdge(s.id, r.type, t.id);
    edges++;
    onProgress?.({
      stage: "write-edges",
      message: `${s.name} —${r.type}→ ${t.name}`,
      current: edgesSeen,
      total: edgeTotal,
    });
  }

  const redactions = [...byTempId.values()].filter(
    (v) => v.type === "RedactedSpan",
  ).length;

  return { nodes: byTempId.size + (hasDocNode ? 0 : 1), edges, redactions };
}

async function writeNode(
  type: NodeType,
  id: string,
  name: string,
  props: Record<string, unknown>,
): Promise<void> {
  await runQuery(
    `MERGE (n:${type} {id: $id})
     SET n.name = $name, n += $props`,
    { id, name, props },
  );
}

async function writeDocumentNode(
  id: string,
  name: string,
  doc: DocInput,
  embedding: number[],
  props: Record<string, unknown>,
): Promise<void> {
  await runQuery(
    `MERGE (n:Document {id: $id})
     SET n.name = $name,
         n.title = $title,
         n.text = $text,
         n.source = $source,
         n.embedding = $embedding,
         n += $props`,
    {
      id,
      name,
      title: doc.title,
      text: doc.text,
      source: doc.source ?? doc.id,
      embedding,
      props,
    },
  );
}

async function writeEdge(
  sourceId: string,
  type: string,
  targetId: string,
): Promise<void> {
  await runQuery(
    `MATCH (s {id: $sourceId}), (t {id: $targetId})
     MERGE (s)-[r:${type}]->(t)`,
    { sourceId, targetId },
  );
}
