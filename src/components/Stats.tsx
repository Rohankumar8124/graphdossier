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
        <code className="text-foreground">pnpm ingest --reset</code> to load the
        Project Greenfield corpus.
      </div>
    );
  }

  const entries = Object.entries(data.counts).filter(([, c]) => c > 0);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted">In the graph now</span>
        <Link href="/explorer" className="text-sm text-accent-2 hover:underline">
          Explore →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {entries.map(([type, count]) => (
          <div key={type} className="rounded-md bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: NODE_COLORS[type as keyof typeof NODE_COLORS] }}
              />
              <span className="text-xs text-muted">{type}</span>
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {count}
            </div>
          </div>
        ))}
        <div className="rounded-md bg-surface-2 p-3">
          <div className="text-xs text-muted">Connections</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {data.edges}
          </div>
        </div>
      </div>
    </div>
  );
}
