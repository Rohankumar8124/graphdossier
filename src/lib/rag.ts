/**
 * GraphRAG retrieval.
 *
 * Plain vector search returns relevant documents; the *graph* part enriches
 * each hit with its connected entities and — distinctively — any redacted
 * spans, so the model can reason about who/what is linked and what's hidden,
 * not just the prose.
 */
import { getEmbeddings } from "./gemini";
import { runQuery, VECTOR_INDEX } from "./neo4j";
import neo4j from "neo4j-driver";
import type { RetrievedContext } from "./types";

interface DocHit {
  id: string;
  title: string;
  text: string;
  score: number;
}

interface NeighborRow {
  rel: string;
  dir: string;
  type: string;
  name: string;
  exemptionCode: string | null;
}

/** Vector search for the top-k most relevant documents. */
async function searchDocuments(query: string, k: number): Promise<DocHit[]> {
  const embedding = await getEmbeddings().embedQuery(query);
  return runQuery<DocHit>(
    `CALL db.index.vector.queryNodes($index, $k, $embedding)
     YIELD node, score
     RETURN node.id AS id, node.title AS title, node.text AS text, score
     ORDER BY score DESC`,
    { index: VECTOR_INDEX, k: neo4j.int(k), embedding },
  );
}

/** One hop out from a document: connected entities and redactions. */
async function neighbors(docId: string): Promise<NeighborRow[]> {
  return runQuery<NeighborRow>(
    `MATCH (d:Document {id: $docId})-[r]-(n)
     RETURN type(r) AS rel,
            CASE WHEN startNode(r) = d THEN 'out' ELSE 'in' END AS dir,
            labels(n)[0] AS type,
            coalesce(n.name, n.title, '?') AS name,
            n.exemptionCode AS exemptionCode
     LIMIT 50`,
    { docId },
  );
}

export interface RagContext {
  prompt: string;
  sources: RetrievedContext[];
}

/**
 * Build the grounded context block for a question: document snippets plus a
 * compact, per-document relationship/redaction summary.
 */
export async function buildContext(
  question: string,
  k = 5,
): Promise<RagContext> {
  const hits = await searchDocuments(question, k);
  const sources: RetrievedContext[] = [];
  const blocks: string[] = [];

  for (const hit of hits) {
    const nbrs = await neighbors(hit.id);
    const rels = nbrs
      .filter((n) => n.type !== "RedactedSpan")
      .map((n) =>
        n.dir === "out"
          ? `${n.rel} → ${n.type}:${n.name}`
          : `${n.type}:${n.name} → ${n.rel}`,
      );
    const redactions = nbrs
      .filter((n) => n.type === "RedactedSpan")
      .map(
        (n) =>
          `[REDACTED${n.exemptionCode ? ` ${n.exemptionCode}` : ""}] ${n.name}`,
      );

    const snippet = hit.text.slice(0, 700);
    sources.push({
      documentId: hit.id,
      title: hit.title,
      snippet,
      score: hit.score,
    });

    blocks.push(
      [
        `### ${hit.title}  (id: ${hit.id})`,
        snippet,
        rels.length ? `RELATIONSHIPS: ${rels.join("; ")}` : "",
        redactions.length ? `REDACTIONS: ${redactions.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const prompt = blocks.length
    ? blocks.join("\n\n")
    : "(No matching documents found in the corpus.)";

  return { prompt, sources };
}

export const RAG_SYSTEM_PROMPT = [
  "You are Graphdossier, an investigative assistant that answers strictly from a",
  "set of released FOIA/RTI documents and the knowledge graph extracted from",
  "them. Use ONLY the provided context. Cite documents inline by their title",
  "or id. When a relevant fact is hidden behind a redaction, say so explicitly",
  "and name the exemption code — redactions are leads worth surfacing. If the",
  "context does not contain the answer, say you cannot find it in the released",
  "records. Be concise and precise; this is for accountability reporting.",
].join(" ");
