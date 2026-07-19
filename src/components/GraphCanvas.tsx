"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";
import { NODE_COLORS, NODE_TYPES, type NodeType } from "@/lib/ontology";
import type { GraphData, GraphNode } from "@/lib/types";

export default function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [status, setStatus] = useState<"loading" | "empty" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cy: Core | null = null;

    (async () => {
      try {
        const res = await fetch("/api/graph");
        const data: GraphData = await res.json();
        if (!data.nodes?.length) {
          setStatus("empty");
          return;
        }

        const elements: ElementDefinition[] = [
          ...data.nodes.map((n) => ({
            data: { id: n.id, label: n.label, type: n.type, raw: n },
          })),
          ...data.edges.map((e) => ({
            data: {
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.type,
            },
          })),
        ];

        cy = cytoscape({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: "node",
              style: {
                "background-color": (ele) =>
                  NODE_COLORS[ele.data("type") as NodeType] ?? "#888",
                label: "data(label)",
                color: "#e7ecf3",
                "font-size": 9,
                "text-valign": "bottom",
                "text-margin-y": 4,
                "text-max-width": "90px",
                "text-wrap": "ellipsis",
                width: 22,
                height: 22,
                "border-width": 0,
              },
            },
            {
              // Redactions stand out: larger, ringed.
              selector: 'node[type = "RedactedSpan"]',
              style: {
                width: 26,
                height: 26,
                "border-width": 3,
                "border-color": "#fca5a5",
                shape: "round-rectangle",
              },
            },
            {
              selector: 'node[type = "Document"]',
              style: { shape: "round-rectangle" },
            },
            {
              selector: "edge",
              style: {
                width: 1,
                "line-color": "#2a3547",
                "target-arrow-color": "#2a3547",
                "target-arrow-shape": "triangle",
                "arrow-scale": 0.7,
                "curve-style": "bezier",
                label: "data(label)",
                "font-size": 7,
                color: "#6b7890",
                "text-rotation": "autorotate",
              },
            },
            {
              selector: "node:selected",
              style: { "border-width": 3, "border-color": "#fff" },
            },
            { selector: ".faded", style: { opacity: 0.12 } },
          ],
          layout: {
            name: "cose",
            animate: false,
            nodeRepulsion: 8000,
            idealEdgeLength: 90,
            padding: 30,
          },
          minZoom: 0.2,
          maxZoom: 3,
        });

        cy.on("tap", "node", (evt) => {
          const node = evt.target;
          setSelected(node.data("raw") as GraphNode);
          cy!.elements().addClass("faded");
          const hood = node.closedNeighborhood();
          hood.removeClass("faded");
        });
        cy.on("tap", (evt) => {
          if (evt.target === cy) {
            setSelected(null);
            cy!.elements().removeClass("faded");
          }
        });

        cyRef.current = cy;
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();

    return () => {
      cy?.destroy();
      cyRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-[calc(100vh-57px)] w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute left-4 top-4 rounded-lg border border-border bg-surface/90 p-3 backdrop-blur">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Node types
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {NODE_TYPES.map((t) => (
            <div key={t} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: NODE_COLORS[t] }}
              />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Overlays */}
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border border-border bg-surface px-6 py-4 text-center text-sm text-muted">
            {status === "loading" && "Loading graph…"}
            {status === "empty" && (
              <>
                The graph is empty. Run{" "}
                <code className="text-foreground">pnpm ingest --reset</code> to
                load the corpus.
              </>
            )}
            {status === "error" && "Could not load the graph."}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="absolute right-4 top-4 w-72 rounded-lg border border-border bg-surface/95 p-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: NODE_COLORS[selected.type] }}
            />
            <span className="text-xs uppercase tracking-wide text-muted">
              {selected.type}
            </span>
          </div>
          <div className="mt-1 font-semibold">{selected.label}</div>
          <dl className="mt-3 space-y-1.5 text-sm">
            {Object.entries(selected.properties)
              .filter(([k]) => k !== "id" && k !== "name" && k !== "title")
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="break-words">{String(v)}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </div>
  );
}
