"use client";

import dynamic from "next/dynamic";

// Cytoscape touches the DOM/window, so load it client-side only.
const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), {
  ssr: false,
});

export default function ExplorerPage() {
  return <GraphCanvas />;
}
