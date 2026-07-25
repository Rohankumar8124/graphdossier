/**
 * /api/edges — relationships.
 *   POST   {sourceId, relationship, targetId}  create (schema-validated)
 *   DELETE {sourceId, relationship, targetId}  remove
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { createEdge, deleteEdge } from "@/lib/graph-ops";
import { RELATIONSHIP_TYPES } from "@/lib/graph-schema";

export const runtime = "nodejs";

const Body = z.object({
  sourceId: z.string().min(1),
  relationship: z.enum(RELATIONSHIP_TYPES),
  targetId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }
  const { sourceId, relationship, targetId } = parsed.data;
  try {
    await createEdge(sourceId, relationship, targetId);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }
  const { sourceId, relationship, targetId } = parsed.data;
  try {
    await deleteEdge(sourceId, relationship, targetId);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
