"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type FileStatus = "queued" | "working" | "done" | "error";

interface QueueEntry {
  name: string;
  status: FileStatus;
  nodes?: number;
  edges?: number;
  redactions?: number;
  error?: string;
}

interface StageState {
  stage: string;
  message: string;
  current?: number;
  total?: number;
}

interface Totals {
  files: number;
  failed: number;
  nodes: number;
  edges: number;
  redactions: number;
}

const STAGES = [
  { key: "parse", label: "Parse" },
  { key: "extract", label: "Extract" },
  { key: "resolve", label: "Resolve" },
  { key: "embed", label: "Embed" },
  { key: "write-nodes", label: "Write nodes" },
  { key: "write-edges", label: "Write edges" },
];

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [stage, setStage] = useState<StageState | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = (msg: string) => {
    setLog((prev) => [...prev.slice(-199), msg]);
    // Keep the activity log pinned to the newest line.
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || (files.length === 0 && !text.trim())) return;
    setBusy(true);
    setQueue([]);
    setActiveIndex(-1);
    setStage(null);
    setLog([]);
    setTotals(null);
    setFatal(null);

    const form = new FormData();
    for (const f of files) form.append("file", f);
    if (text.trim()) form.append("text", text);
    if (title.trim()) form.append("title", title);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.body) throw new Error("No response stream");
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const err = await res.json();
        throw new Error(err.error ?? `Upload failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw.trim()) continue;
          handleEvent(JSON.parse(raw));
        }
      }
    } catch (err) {
      setFatal((err as Error).message);
    } finally {
      setBusy(false);
      setActiveIndex(-1);
      setStage(null);
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  function handleEvent(ev: any) {
    switch (ev.type) {
      case "queue":
        setQueue(ev.files.map((name: string) => ({ name, status: "queued" })));
        appendLog(`Queued ${ev.total} document${ev.total === 1 ? "" : "s"}`);
        break;
      case "file":
        if (ev.status === "start") {
          setActiveIndex(ev.index);
          setStage(null);
          setQueue((q) =>
            q.map((f, i) => (i === ev.index ? { ...f, status: "working" } : f)),
          );
          appendLog(`▶ ${ev.name}`);
        } else if (ev.status === "done") {
          setQueue((q) =>
            q.map((f, i) =>
              i === ev.index
                ? {
                    ...f,
                    status: "done",
                    nodes: ev.nodes,
                    edges: ev.edges,
                    redactions: ev.redactions,
                  }
                : f,
            ),
          );
          appendLog(
            `✓ ${ev.name} — ${ev.nodes} nodes, ${ev.edges} edges, ${ev.redactions} redactions`,
          );
        } else if (ev.status === "error") {
          setQueue((q) =>
            q.map((f, i) =>
              i === ev.index ? { ...f, status: "error", error: ev.error } : f,
            ),
          );
          appendLog(`✗ ${ev.name} — ${ev.error}`);
        }
        break;
      case "progress":
        setStage({
          stage: ev.stage,
          message: ev.message,
          current: ev.current,
          total: ev.total,
        });
        if (ev.stage === "extract" || ev.stage === "embed" || ev.stage === "parse") {
          appendLog(`  ${ev.message}`);
        }
        break;
      case "done":
        setTotals(ev);
        break;
      case "error":
        setFatal(ev.message);
        break;
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const doneCount = queue.filter((f) => f.status === "done" || f.status === "error").length;
  const stageIndex = stage ? STAGES.findIndex((s) => s.key === stage.stage) : -1;
  const showPipeline = queue.length > 0 || fatal;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-semibold">Add documents</h1>
      <p className="mt-2 text-muted">
        Drop in released PDFs or paste text. Graphdossier extracts entities,
        relationships, and redactions and merges them into the live graph —
        watch every stage below as it happens.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Title (optional, applied to a single file or pasted text)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Memo: accelerated review"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            PDF or .txt files
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-foreground"
          />
          {files.length > 1 && (
            <p className="mt-1 text-xs text-muted">
              {files.length} files selected — they will be ingested one after another.
            </p>
          )}
        </div>

        <div className="text-center text-xs uppercase tracking-wide text-muted">
          and / or
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Paste text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste the document text here…"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm outline-none focus:border-accent-2"
          />
        </div>

        <button
          type="submit"
          disabled={busy || (files.length === 0 && !text.trim())}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background disabled:opacity-40"
        >
          {busy ? "Ingesting…" : "Extract & add to graph"}
        </button>
      </form>

      {showPipeline && (
        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          {/* Overall progress */}
          <div className="flex items-center justify-between">
            <p className="font-medium">
              {busy
                ? `Ingesting ${doneCount + 1 <= queue.length ? doneCount + 1 : queue.length} of ${queue.length}`
                : "Ingestion pipeline"}
            </p>
            <p className="text-sm text-muted">
              {doneCount}/{queue.length} done
              {queue.length - doneCount > 0 && busy
                ? ` · ${queue.length - doneCount} remaining`
                : ""}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent-2 transition-all duration-300"
              style={{
                width: `${queue.length ? (doneCount / queue.length) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Per-file queue */}
          <ul className="mt-4 space-y-1.5 text-sm">
            {queue.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 shrink-0 text-center">
                  {f.status === "queued" && <span className="text-muted">○</span>}
                  {f.status === "working" && (
                    <span className="inline-block animate-spin text-accent-2">◐</span>
                  )}
                  {f.status === "done" && <span className="text-accent-2">✓</span>}
                  {f.status === "error" && <span className="text-accent">✗</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={f.status === "queued" ? "text-muted" : ""}>
                    {f.name}
                  </span>
                  {f.status === "done" && (
                    <span className="text-muted">
                      {" "}
                      — {f.nodes} nodes, {f.edges} edges, {f.redactions} redactions
                    </span>
                  )}
                  {f.status === "error" && (
                    <span className="text-accent"> — {f.error}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {/* Stage stepper for the active file */}
          {busy && activeIndex >= 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
                {STAGES.map((s, i) => (
                  <span key={s.key} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted">→</span>}
                    <span
                      className={
                        i === stageIndex
                          ? "rounded bg-surface-2 px-2 py-1 font-medium text-accent-2"
                          : i < stageIndex
                            ? "px-1 text-foreground"
                            : "px-1 text-muted"
                      }
                    >
                      {s.label}
                      {i === stageIndex &&
                        stage?.current !== undefined &&
                        stage?.total !== undefined && (
                          <span className="ml-1 tabular-nums">
                            {stage.current}/{stage.total}
                          </span>
                        )}
                    </span>
                  </span>
                ))}
              </div>
              {stage && (
                <p className="mt-2 truncate font-mono text-xs text-muted">
                  {stage.message}
                </p>
              )}
              {stage?.current !== undefined && stage?.total !== undefined && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent-2 transition-all"
                    style={{ width: `${(stage.current / stage.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Activity log */}
          {log.length > 0 && (
            <div
              ref={logRef}
              className="mt-4 max-h-36 overflow-y-auto rounded border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-muted"
            >
              {log.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {l}
                </div>
              ))}
            </div>
          )}

          {/* Final summary */}
          {totals && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-medium">
                Done: {totals.files} ingested
                {totals.failed > 0 ? `, ${totals.failed} failed` : ""}.
              </p>
              <p className="mt-1 text-sm text-muted">
                {totals.nodes} nodes, {totals.edges} relationships,{" "}
                {totals.redactions} redacted spans added to the graph.
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href="/explorer" className="text-accent-2 hover:underline">
                  See it in the graph →
                </Link>
                <Link href="/chat" className="text-accent-2 hover:underline">
                  Ask about it →
                </Link>
              </div>
            </div>
          )}

          {fatal && <p className="mt-4 text-accent">Error: {fatal}</p>}
        </div>
      )}
    </div>
  );
}
