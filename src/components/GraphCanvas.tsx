"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";
import { NODE_COLORS, NODE_TYPES, type NodeType } from "@/lib/graph-schema";
import type { GraphData, GraphNode } from "@/lib/types";

/**
 * The graph explorer canvas.
 *
 * Analyst-grade rendering: nodes sized by connectivity, quiet edges whose
 * labels appear only on hover/selection, neighborhood spotlight on hover,
 * per-type filtering from the legend, live node/edge counts, and
 * recenter / zoom controls.
 */
export default function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<NodeType>>(new Set());
  const [status, setStatus] = useState<"loading" | "empty" | "ready" | "error">(
    "loading",
  );

  const typeCounts = useMemo(() => {
    const c = {} as Record<NodeType, number>;
    for (const t of NODE_TYPES) c[t] = 0;
    for (const n of data?.nodes ?? []) c[n.type as NodeType]++;
    return c;
  }, [data]);

  const visibleCounts = useMemo(() => {
    if (!data) return { nodes: 0, edges: 0 };
    const visibleIds = new Set(
      data.nodes
        .filter((n) => !hiddenTypes.has(n.type as NodeType))
        .map((n) => n.id),
    );
    return {
      nodes: visibleIds.size,
      edges: data.edges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
      ).length,
    };
  }, [data, hiddenTypes]);

  // build the canvas when data arrives
  useEffect(() => {
    let cy: Core | null = null;

    (async () => {
      try {
        const res = await fetch("/api/graph");
        const g: GraphData = await res.json();
        if (!g.nodes?.length) {
          setStatus("empty");
          return;
        }
        setData(g);

        // degree per node → size hubs up
        const degree = new Map<string, number>();
        for (const e of g.edges) {
          degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
          degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
        }

        const elements: ElementDefinition[] = [
          ...g.nodes.map((n) => ({
            data: {
              id: n.id,
              label: n.label,
              type: n.type,
              deg: degree.get(n.id) ?? 0,
              raw: n,
            },
          })),
          ...g.edges.map((e) => ({
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
                color: "#aab6c8",
                "font-size": 8.5,
                "font-weight": 500,
                "text-valign": "bottom",
                "text-margin-y": 5,
                "text-max-width": "88px",
                "text-wrap": "ellipsis",
                // hubs read bigger: 14px base +2px per connection, capped
                width: (ele: cytoscape.NodeSingular) =>
                  Math.min(34, 14 + ele.data("deg") * 2),
                height: (ele: cytoscape.NodeSingular) =>
                  Math.min(34, 14 + ele.data("deg") * 2),
                "border-width": 1.5,
                "border-color": "#0b0f17",
                "overlay-opacity": 0,
              },
            },
            {
              // Redactions stand out: ringed — the leads.
              selector: 'node[type = "RedactedSpan"]',
              style: {
                "border-width": 2.5,
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
                "line-color": "#232d3e",
                "target-arrow-color": "#2f3b50",
                "target-arrow-shape": "triangle",
                "arrow-scale": 0.6,
                "curve-style": "bezier",
                label: "", // quiet by default — labels only on focus
                "font-size": 7,
                color: "#8fa0b8",
                "text-rotation": "autorotate",
                "text-background-color": "#0b0f17",
                "text-background-opacity": 0.85,
                "text-background-padding": "1px",
              },
            },
            {
              // focused edges get their relationship label back
              selector: "edge.focused",
              style: {
                label: "data(label)",
                "line-color": "#4a5a75",
                "target-arrow-color": "#64748b",
                width: 1.6,
              },
            },
            {
              selector: "node:selected",
              style: { "border-width": 3, "border-color": "#fff" },
            },
            { selector: ".faded", style: { opacity: 0.08 } },
            { selector: ".hidden-type", style: { display: "none" } },
          ],
          layout: {
            name: "cose",
            animate: false,
            nodeRepulsion: 12000,
            idealEdgeLength: 110,
            gravity: 0.25,
            padding: 40,
          },
          minZoom: 0.15,
          maxZoom: 3,
        });

        const spotlight = (node: cytoscape.NodeSingular) => {
          const hood = node.closedNeighborhood();
          cy!.elements().not(".hidden-type").addClass("faded");
          hood.removeClass("faded");
          hood.edges().addClass("focused");
        };
        const clearSpotlight = () => {
          cy!.elements().removeClass("faded");
          cy!.edges().removeClass("focused");
        };

        // hover: spotlight the neighborhood
        cy.on("mouseover", "node", (evt) => spotlight(evt.target));
        cy.on("mouseout", "node", () => {
          const sel = cy!.$("node:selected");
          if (sel.length) spotlight(sel[0]);
          else clearSpotlight();
        });

        cy.on("tap", "node", (evt) => {
          const node = evt.target;
          setSelected(node.data("raw") as GraphNode);
          spotlight(node);
        });
        cy.on("tap", (evt) => {
          if (evt.target === cy) {
            setSelected(null);
            clearSpotlight();
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

  // apply legend type-filtering
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.nodes().removeClass("hidden-type");
      for (const t of hiddenTypes) {
        cy.nodes(`[type = "${t}"]`).addClass("hidden-type");
      }
      cy.edges().removeClass("hidden-type");
      cy.edges().forEach((e) => {
        if (
          e.source().hasClass("hidden-type") ||
          e.target().hasClass("hidden-type")
        )
          e.addClass("hidden-type");
      });
    });
  }, [hiddenTypes]);

  function toggleType(t: NodeType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function recenter() {
    const cy = cyRef.current;
    if (!cy) return;
    const vis = cy.elements().not(".hidden-type");
    if (vis.length)
      cy.animate({ fit: { eles: vis, padding: 40 } }, { duration: 350 });
  }
  function zoom(f: number) {
    const cy = cyRef.current;
    if (!cy) return;
    cy.animate(
      {
        zoom: {
          level: cy.zoom() * f,
          renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
        },
      },
      { duration: 180 },
    );
  }

  return (
    <div className="relative h-[calc(100vh-57px)] w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Legend + live counts + type filters */}
      <div className="absolute left-4 top-4 rounded-lg border border-border bg-surface/90 p-3 backdrop-blur">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
          In view
        </div>
        <div className="mb-2 font-mono text-sm">
          <span className="text-foreground">{visibleCounts.nodes}</span>
          <span className="text-muted"> nodes · </span>
          <span className="text-foreground">{visibleCounts.edges}</span>
          <span className="text-muted"> relationships</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {NODE_TYPES.map((t) => {
            const off = hiddenTypes.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                title={off ? `Show ${t}` : `Hide ${t}`}
                aria-pressed={!off}
                className={`flex items-center gap-2 rounded px-1 py-0.5 text-left text-xs transition-opacity hover:bg-surface-2 ${
                  off ? "opacity-35" : ""
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: NODE_COLORS[t] }}
                />
                {t}
                <span className="ml-auto font-mono text-[10px] text-muted">
                  {typeCounts[t]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 max-w-[220px] text-[10px] text-muted">
          Click a type to toggle it · hover a node to spotlight its neighborhood
        </p>
      </div>

      {/* Controls: zoom + recenter */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
        {(
          [
            ["+", () => zoom(1.3), "Zoom in"],
            ["−", () => zoom(1 / 1.3), "Zoom out"],
            ["⌖", recenter, "Recenter graph"],
          ] as const
        ).map(([lbl, fn, aria]) => (
          <button
            key={lbl}
            onClick={fn}
            aria-label={aria}
            title={aria}
            className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface/90 text-base text-muted backdrop-blur transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Overlays */}
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border border-border bg-surface px-6 py-4 text-center text-sm text-muted">
            {status === "loading" && "Loading graph…"}
            {status === "empty" && (
              <>
                The graph is empty. Run{" "}
                <code className="text-foreground">pnpm ingest --reset</code>{" "}
                to load the corpus.
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
            <button
              onClick={() => setSelected(null)}
              aria-label="Close details"
              className="ml-auto text-muted hover:text-foreground"
            >
              ✕
            </button>
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
