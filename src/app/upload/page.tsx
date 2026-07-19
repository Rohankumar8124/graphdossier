"use client";

import { useState } from "react";
import Link from "next/link";

interface Result {
  ok?: boolean;
  title?: string;
  nodes?: number;
  edges?: number;
  redactions?: number;
  error?: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || (!file && !text.trim())) return;
    setBusy(true);
    setResult(null);

    const form = new FormData();
    if (file) form.append("file", file);
    if (text.trim()) form.append("text", text);
    if (title.trim()) form.append("title", title);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-semibold">Add a document</h1>
      <p className="mt-2 text-muted">
        Drop in a released PDF or paste text. Graphdossier extracts entities,
        relationships, and redactions and merges them into the live graph.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Memo: accelerated review"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PDF or .txt file</label>
          <input
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-foreground"
          />
        </div>

        <div className="text-center text-xs uppercase tracking-wide text-muted">
          or
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
          disabled={busy || (!file && !text.trim())}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background disabled:opacity-40"
        >
          {busy ? "Extracting…" : "Extract & add to graph"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          {result.error ? (
            <p className="text-accent">Error: {result.error}</p>
          ) : (
            <>
              <p className="font-medium">Added “{result.title}”.</p>
              <p className="mt-1 text-sm text-muted">
                {result.nodes} nodes, {result.edges} relationships,{" "}
                {result.redactions} redacted spans extracted.
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href="/explorer" className="text-accent-2 hover:underline">
                  See it in the graph →
                </Link>
                <Link href="/chat" className="text-accent-2 hover:underline">
                  Ask about it →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
