/**
 * POST /api/upload — ingest a single released document at runtime.
 *
 * Accepts multipart/form-data with either a `file` (PDF or .txt) or a `text`
 * field, plus an optional `title`. Extracts text, ensures the schema, and runs
 * the same extract → resolve → embed → write pipeline as the CLI.
 */
import { NextRequest } from "next/server";
// Import the library entry directly to avoid pdf-parse@1's debug-mode file read.
import pdf from "pdf-parse/lib/pdf-parse.js";
import { ensureSchema } from "@/lib/neo4j";
import { ingestDocument } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

function slugId(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `upload-${base || "doc"}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  const pastedText = form.get("text");
  let title = (form.get("title") as string | null)?.trim() || "";
  let text = "";

  try {
    if (file && file instanceof File && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const parsed = await pdf(buf);
        text = parsed.text;
      } else {
        text = buf.toString("utf8");
      }
      if (!title) title = file.name.replace(/\.[^.]+$/, "");
    } else if (typeof pastedText === "string" && pastedText.trim()) {
      text = pastedText;
      if (!title) title = "Pasted document";
    }
  } catch (err) {
    return Response.json(
      { error: `Could not read document: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (!text.trim()) {
    return Response.json({ error: "No document content provided" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const summary = await ingestDocument({
      id: slugId(title),
      title,
      text,
      source: "upload",
    });
    return Response.json({ ok: true, title, ...summary });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
