/**
 * /api/nodes — node collection.
 *   GET  ?q=…&type=…   search nodes by partial name/id
 *   POST {type, name}  create (upsert) a node
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { findNodes, createNode } from "@/lib/graph-ops";
import { NODE_TYPES } from "@/lib/graph-schema";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? undefined;
  if (!q) return Response.json({ nodes: [] });
  const parsedType = NODE_TYPES.find((t) => t === type);
  const nodes = await findNodes(q, parsedType);
  return Response.json({ nodes });
}

const CreateBody = z.object({
  type: z.enum(NODE_TYPES),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }
  const node = await createNode(parsed.data.type, parsed.data.name);
  return Response.json({ node }, { status: 201 });
}
