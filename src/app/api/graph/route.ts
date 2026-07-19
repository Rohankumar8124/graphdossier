/**
 * GET /api/graph — the whole knowledge graph for the explorer.
 *
 * Heavy properties (`embedding`, full `text`) are stripped server-side so the
 * payload stays small.
 */
import { NextRequest } from "next/server";
import { runQuery } from "@/lib/neo4j";
import neo4j from "neo4j-driver";
import type { GraphData, GraphNode, GraphEdge } from "@/lib/types";
import type { NodeType } from "@/lib/ontology";

export const runtime = "nodejs";

const STRIP = new Set(["embedding", "text"]);

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 500);

  const nodeRows = await runQuery<{
    id: string;
    label: string;
    type: NodeType;
    props: Record<string, unknown>;
  }>(
    `MATCH (n)
     RETURN n.id AS id,
            coalesce(n.name, n.title, n.id) AS label,
            labels(n)[0] AS type,
            properties(n) AS props
     LIMIT $limit`,
    { limit: neo4j.int(limit) },
  );

  const ids = new Set(nodeRows.map((n) => n.id));

  const edgeRows = await runQuery<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>(
    `MATCH (s)-[r]->(t)
     RETURN elementId(r) AS id, s.id AS source, t.id AS target, type(r) AS type
     LIMIT $limit`,
    { limit: neo4j.int(limit * 4) },
  );

  const nodes: GraphNode[] = nodeRows.map((n) => {
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(n.props ?? {})) {
      if (!STRIP.has(k)) properties[k] = v;
    }
    return { id: n.id, label: n.label, type: n.type, properties };
  });

  // Only keep edges whose endpoints are present in the node set.
  const edges: GraphEdge[] = edgeRows
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.type }));

  const data: GraphData = { nodes, edges };
  return Response.json(data);
}
