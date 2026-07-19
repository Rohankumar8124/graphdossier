/**
 * GET /api/stats — headline counts for the landing page.
 */
import { runQuery } from "@/lib/neo4j";
import { NODE_TYPES } from "@/lib/ontology";

export const runtime = "nodejs";

export async function GET() {
  try {
    const counts: Record<string, number> = {};
    for (const label of NODE_TYPES) {
      const rows = await runQuery<{ c: number }>(
        `MATCH (n:${label}) RETURN count(n) AS c`,
      );
      counts[label] = toNum(rows[0]?.c);
    }
    const edgeRows = await runQuery<{ c: number }>(
      `MATCH ()-[r]->() RETURN count(r) AS c`,
    );
    const edges = toNum(edgeRows[0]?.c);

    return Response.json({ counts, edges, ready: true });
  } catch (err) {
    // Graph not provisioned yet — let the UI show a setup hint instead of 500.
    return Response.json({
      counts: {},
      edges: 0,
      ready: false,
      error: (err as Error).message,
    });
  }
}

// neo4j integers arrive as {low, high}; coerce to a JS number.
function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "low" in v) {
    return (v as { low: number }).low;
  }
  return 0;
}
