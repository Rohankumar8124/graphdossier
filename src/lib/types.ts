/**
 * Shared types used across the API routes and UI.
 */
import type { NodeType, RelationshipType } from "./ontology";

/** A node as returned to the graph explorer. */
export interface GraphNode {
  id: string;
  label: string; // display name
  type: NodeType;
  /** Arbitrary extracted properties (exemption code, date, role, …). */
  properties: Record<string, unknown>;
}

/** An edge as returned to the graph explorer. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType | string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** A source snippet surfaced alongside a GraphRAG answer. */
export interface RetrievedContext {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface ChatRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}
