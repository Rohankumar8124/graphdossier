"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { RetrievedContext } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: RetrievedContext[];
}

const SUGGESTIONS = [
  "Who buried the Atwater Mill contamination report, and how?",
  "What is hidden behind the redactions, and which exemptions are cited?",
  "Map the relationship between Meridian, the Mayor, and Greg Patterson.",
  "Was the soil consultant really independent?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const next: Message[] = [
      ...messages,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ];
    setMessages(next);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const apply = (fn: (m: Message) => Message) =>
        setMessages((cur) => {
          const copy = [...cur];
          copy[copy.length - 1] = fn(copy[copy.length - 1]);
          return copy;
        });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.trim()) continue;
          const evt = JSON.parse(ln);
          if (evt.type === "sources") {
            apply((m) => ({ ...m, sources: evt.sources }));
          } else if (evt.type === "token") {
            apply((m) => ({ ...m, content: m.content + evt.text }));
          } else if (evt.type === "error") {
            apply((m) => ({
              ...m,
              content: m.content + `\n\n> ⏸ **Held up.** ${evt.message}`,
            }));
          }
        }
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }
    } catch (err) {
      setMessages((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `> ⏸ **Held up.** Couldn't reach the server (${(err as Error).message}). Please try again.`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col px-5">
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto py-8">
        {messages.length === 0 && (
          <div className="pt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              GraphRAG · grounded in your records
            </p>
            <h1 className="mt-2 text-3xl font-bold">Ask the released records</h1>
            <p className="mt-2 max-w-lg text-muted">
              Answers are grounded in the Project Greenfield corpus and cite the
              documents they came from.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-border bg-surface p-3.5 text-left text-sm text-muted transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            {m.role === "user" ? (
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2.5 text-[15px]">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[95%]">
                <div className="prose-dossier">
                  {m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <span className="text-sm text-muted">
                      Searching the records…
                    </span>
                  )}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                    <div className="font-mono text-[11px] uppercase tracking-widest text-accent">
                      Sources
                    </div>
                    {m.sources.map((s) => (
                      <details
                        key={s.documentId}
                        className="group rounded-md border border-border bg-surface text-sm open:border-accent/30"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-medium marker:content-none">
                          <span className="text-muted transition-transform group-open:rotate-90">
                            ▸
                          </span>
                          {s.title}
                          <span className="ml-auto shrink-0 font-mono text-xs text-muted">
                            {s.score.toFixed(2)}
                          </span>
                        </summary>
                        <pre className="whitespace-pre-wrap border-t border-border px-3 py-2.5 font-sans text-xs leading-relaxed text-muted">
                          {s.snippet}
                        </pre>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mb-5 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the records…"
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-accent px-5 py-3 font-medium text-background disabled:opacity-40"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
