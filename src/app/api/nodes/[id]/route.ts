/**
 * /api/nodes/[id] — a single node (canonical id, URL-encoded).
 *   PATCH  {name}  rename
 *   DELETE         remove the node and its relationships
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { renameNode, deleteNode } from "@/lib/graph-ops";

export const runtime = "nodejs";

const PatchBody = z.object({ name: z.string().min(1) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }
  try {
    await renameNode(decodeURIComponent(id), parsed.data.name);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await deleteNode(decodeURIComponent(id));
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
