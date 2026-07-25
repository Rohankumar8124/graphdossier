/**
 * POST /api/chat — streaming GraphRAG answer.
 *
 * Response is newline-delimited JSON (NDJSON). The first line carries the
 * retrieved sources; subsequent lines stream answer tokens; a final line marks
 * completion:
 *   {"type":"sources","sources":[...]}
 *   {"type":"token","text":"..."}
 *   {"type":"done"}
 */
import { NextRequest } from "next/server";
import { getChatModel } from "@/lib/gemini";
import { buildContext, RAG_SYSTEM_PROMPT } from "@/lib/rag";
import { runGraphEditor } from "@/lib/agent";
import { classifyIntent } from "@/lib/intent";
import type { ChatRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const message = body.message?.trim();
  if (!message) return new Response("Missing 'message'", { status: 400 });

  const encoder = new TextEncoder();
  const line = (obj: unknown) => encoder.encode(JSON.stringify(obj) + "\n");

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Intent-classified routing: edit commands go to the LangGraph
        // editing agent (name→id resolution, schema-validated mutations);
        // everything else flows to GraphRAG Q&A below.
        if ((await classifyIntent(message)) === "graph_edit") {
          const history = (body.history ?? []).map((h) => ({
            role:
              h.role === "assistant"
                ? ("assistant" as const)
                : ("user" as const),
            content: h.content,
          }));
          const { reply, mutated } = await runGraphEditor(message, history);
          controller.enqueue(line({ type: "sources", sources: [] }));
          controller.enqueue(line({ type: "token", text: reply }));
          if (mutated) controller.enqueue(line({ type: "mutated" }));
          controller.enqueue(line({ type: "done" }));
          return;
        }

        const { prompt, sources } = await buildContext(message);
        controller.enqueue(line({ type: "sources", sources }));

        const history = (body.history ?? []).map((h) => ({
          role: h.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: h.content,
        }));

        const model = getChatModel({ streaming: true, temperature: 0.2 });
        const messages = [
          { role: "system" as const, content: RAG_SYSTEM_PROMPT },
          ...history,
          {
            role: "user" as const,
            content: `CONTEXT FROM RELEASED RECORDS:\n\n${prompt}\n\n---\n\nQUESTION: ${message}`,
          },
        ];

        const tokens = await model.stream(messages);
        for await (const chunk of tokens) {
          const text =
            typeof chunk.content === "string"
              ? chunk.content
              : Array.isArray(chunk.content)
                ? chunk.content
                    .map((c) => ("text" in c ? c.text : ""))
                    .join("")
                : "";
          if (text) controller.enqueue(line({ type: "token", text }));
        }
        controller.enqueue(line({ type: "done" }));
      } catch (err) {
        controller.enqueue(
          line({ type: "error", message: (err as Error).message }),
        );
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
