/**
 * GET /api/graph — the whole knowledge graph for the explorer.
 *
 * Heavy properties (`embedding`, full `text`) are stripped server-side so the
 * payload stays small.
 */
import { NextRequest } from "next/server";
import { runQuery } from "@/lib/graphdb";
import type { GraphData, GraphNode, GraphEdge } from "@/lib/types";
import type { NodeType } from "@/lib/graph-schema";

export const runtime = "nodejs";

const STRIP = new Set(["embedding", "text", "_id", "_label"]);

export async function GET(req: NextRequest) {
  const limit = Math.max(1, Math.min(5000, Number(req.nextUrl.searchParams.get("limit") ?? 500)));

  const nodeRows = await runQuery<{ n: Record<string, unknown> }>(
    `MATCH (n) RETURN n LIMIT ${limit}`,
  );

  const nodes: GraphNode[] = nodeRows.map(({ n }) => {
    const type = String(n._label ?? "") as NodeType;
    const id = String(n.id ?? "");
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(n)) {
      if (!STRIP.has(k) && v !== null && v !== undefined && v !== "")
        properties[k] = v;
    }
    return {
      id,
      label: String(n.name ?? n.title ?? id),
      type,
      properties,
    };
  });

  const ids = new Set(nodes.map((n) => n.id));

  const edgeRows = await runQuery<{
    source: string;
    target: string;
    type: string;
  }>(
    `MATCH (s)-[r]->(t)
     RETURN s.id AS source, t.id AS target, label(r) AS type
     LIMIT ${limit * 4}`,
  );

  // Only keep edges whose endpoints are present in the node set.
  const edges: GraphEdge[] = edgeRows
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => ({
      id: `${e.source}|${e.type}|${e.target}|${i}`,
      source: e.source,
      target: e.target,
      type: e.type,
    }));

  const data: GraphData = { nodes, edges };
  return Response.json(data);
}
