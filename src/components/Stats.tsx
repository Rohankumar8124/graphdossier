"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NODE_COLORS } from "@/lib/graph-schema";

interface StatsResponse {
  counts: Record<string, number>;
  edges: number;
  ready: boolean;
}

export default function Stats() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!data) {
    return <div className="text-sm text-muted">Loading corpus stats…</div>;
  }

  const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
  if (!data.ready || total === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
        No graph yet. Add your Gemini key to{" "}
        <code className="text-foreground">.env.local</code> and run{" "}
        <code className="text-foreground">pnpm ingest --reset</code>{" "}
        to load the Project Greenfield corpus.
      </div>
    );
  }

  const entries = Object.entries(data.counts).filter(([, c]) => c > 0);

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <span className="font-mono text-xs uppercase tracking-widest text-accent">
          Case file tally — live
        </span>
        <Link
          href="/explorer"
          className="text-sm font-medium text-accent transition-colors hover:text-foreground"
        >
          Explore the graph →
        </Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-5">
        {entries.map(([type, count]) => (
          <div key={type} className="min-w-[92px]">
            <div className="flex items-baseline gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: NODE_COLORS[type as keyof typeof NODE_COLORS] }}
              />
              <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
                {count}
              </span>
            </div>
            <div className="mt-0.5 pl-4 text-xs text-muted">{type}</div>
          </div>
        ))}
        <div className="min-w-[92px] border-l border-border pl-8">
          <span className="font-mono text-3xl font-bold tabular-nums text-accent">
            {data.edges}
          </span>
          <div className="mt-0.5 text-xs text-muted">Connections</div>
        </div>
      </div>
    </div>
  );
}
