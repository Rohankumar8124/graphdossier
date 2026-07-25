/**
 * POST /api/upload — ingest released documents at runtime, with live progress.
 *
 * Accepts multipart/form-data with one or more `file` entries (PDF or .txt)
 * and/or a `text` field, plus an optional `title`. Each document runs through
 * the same extract → resolve → embed → write pipeline as the CLI.
 *
 * Response is newline-delimited JSON (NDJSON) so the client can render the
 * pipeline in real time:
 *   {"type":"queue","files":["a.pdf","b.txt"],"total":2}
 *   {"type":"file","index":0,"name":"a.pdf","status":"start"}
 *   {"type":"progress","index":0,"stage":"extract","message":"…"}
 *   {"type":"progress","index":0,"stage":"write-nodes","message":"…","current":3,"total":12}
 *   {"type":"file","index":0,"name":"a.pdf","status":"done","nodes":12,"edges":9,"redactions":2}
 *   {"type":"done","files":2,"failed":0,"nodes":30,"edges":21,"redactions":4}
 */
import { NextRequest } from "next/server";
// Import the library entry directly to avoid pdf-parse@1's debug-mode file read.
import pdf from "pdf-parse/lib/pdf-parse.js";
import { ensureSchema } from "@/lib/graphdb";
import { ingestDocument } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

function slugId(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `upload-${base || "doc"}-${Date.now().toString(36)}`;
}

interface QueueItem {
  name: string;
  title: string;
  file?: File;
  text?: string;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const files = form
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const pastedText = form.get("text");
  const customTitle = (form.get("title") as string | null)?.trim() || "";

  const queue: QueueItem[] = files.map((f) => ({
    name: f.name,
    title:
      files.length === 1 && customTitle
        ? customTitle
        : f.name.replace(/\.[^.]+$/, ""),
    file: f,
  }));
  if (typeof pastedText === "string" && pastedText.trim()) {
    const title = customTitle || "Pasted document";
    queue.push({ name: title, title, text: pastedText });
  }

  if (queue.length === 0) {
    return Response.json({ error: "No document content provided" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const line = (obj: unknown) => encoder.encode(JSON.stringify(obj) + "\n");

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(line(obj));
      const totals = { files: 0, failed: 0, nodes: 0, edges: 0, redactions: 0 };
      try {
        send({ type: "queue", files: queue.map((q) => q.name), total: queue.length });
        await ensureSchema();

        for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          send({ type: "file", index: i, name: item.name, status: "start" });
          try {
            let text = item.text ?? "";
            if (item.file) {
              send({
                type: "progress",
                index: i,
                stage: "parse",
                message: item.file.name.toLowerCase().endsWith(".pdf")
                  ? "Parsing PDF…"
                  : "Reading file…",
              });
              const buf = Buffer.from(await item.file.arrayBuffer());
              text = item.file.name.toLowerCase().endsWith(".pdf")
                ? (await pdf(buf)).text
                : buf.toString("utf8");
            }
            if (!text.trim()) throw new Error("Document is empty");

            const summary = await ingestDocument(
              {
                id: slugId(item.title),
                title: item.title,
                text,
                source: "upload",
              },
              (p) => send({ type: "progress", index: i, ...p }),
            );

            totals.files++;
            totals.nodes += summary.nodes;
            totals.edges += summary.edges;
            totals.redactions += summary.redactions;
            send({
              type: "file",
              index: i,
              name: item.name,
              status: "done",
              ...summary,
            });
          } catch (err) {
            totals.failed++;
            send({
              type: "file",
              index: i,
              name: item.name,
              status: "error",
              error: (err as Error).message,
            });
          }
        }

        send({ type: "done", ...totals });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
