/**
 * Graphdossier ontology.
 *
 * Turns a pile of released FOIA/RTI documents into a navigable map of
 * who knew what, when — and what's still hidden. The distinctive trait of
 * this ontology is that a *redaction* is a first-class node (`RedactedSpan`),
 * so a blacked-out passage becomes a queryable investigative lead rather than
 * an absence in the text.
 *
 * This single source of truth constrains the Gemini extraction pass
 * (via `allowedNodes` / `allowedRelationships`) and documents the graph schema
 * for the UI and GraphRAG layers.
 */

/** Node labels in the graph. */
export const NODE_TYPES = [
  "Person",
  "Organization",
  "Document",
  "Event",
  "Location",
  "Topic",
  "RedactedSpan",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

/** Relationship (edge) types in the graph. */
export const RELATIONSHIP_TYPES = [
  "SENT", // Person -> Document
  "RECEIVED", // Person -> Document
  "MENTIONS", // Document -> Person | Organization | Topic | Location
  "COMMUNICATED_WITH", // Person -> Person
  "AFFILIATED_WITH", // Person -> Organization
  "ATTENDED", // Person -> Event
  "OCCURRED_AT", // Event -> Location
  "LOCATED_IN", // Organization | Person -> Location
  "ABOUT", // Document | Event -> Topic
  "CONTAINS_REDACTION", // Document -> RedactedSpan
  "REDACTION_CONCEALS", // RedactedSpan -> Person | Organization | Topic (suspected)
  "ALIAS_OF", // entity-resolution link (Person/Org -> canonical Person/Org)
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/**
 * Allowed (source, relationship, target) triples. The extractor is asked to
 * stay within these so the graph keeps a coherent, queryable shape.
 */
export const ALLOWED_TRIPLES: Array<[NodeType, RelationshipType, NodeType]> = [
  ["Person", "SENT", "Document"],
  ["Person", "RECEIVED", "Document"],
  ["Document", "MENTIONS", "Person"],
  ["Document", "MENTIONS", "Organization"],
  ["Document", "MENTIONS", "Topic"],
  ["Document", "MENTIONS", "Location"],
  ["Person", "COMMUNICATED_WITH", "Person"],
  ["Person", "AFFILIATED_WITH", "Organization"],
  ["Person", "ATTENDED", "Event"],
  ["Event", "OCCURRED_AT", "Location"],
  ["Organization", "LOCATED_IN", "Location"],
  ["Person", "LOCATED_IN", "Location"],
  ["Document", "ABOUT", "Topic"],
  ["Event", "ABOUT", "Topic"],
  ["Document", "CONTAINS_REDACTION", "RedactedSpan"],
  ["RedactedSpan", "REDACTION_CONCEALS", "Person"],
  ["RedactedSpan", "REDACTION_CONCEALS", "Organization"],
  ["RedactedSpan", "REDACTION_CONCEALS", "Topic"],
];

/** Human-readable description per node type — used in prompts and the UI legend. */
export const NODE_DESCRIPTIONS: Record<NodeType, string> = {
  Person: "An individual human named or referenced in the documents.",
  Organization:
    "A company, agency, department, NGO, or other named institution.",
  Document:
    "A single released record: email, memo, letter, report, or meeting minutes.",
  Event:
    "A meeting, call, briefing, or other dated occurrence described in the text.",
  Location: "A named place: city, building, region, or address.",
  Topic:
    "A subject, project, initiative, or theme that documents and events are about.",
  RedactedSpan:
    "A blacked-out / withheld passage. Capture its FOIA exemption code if " +
    "stated (e.g. b(5), b(6), b(7)(C)) and the surrounding context that hints " +
    "at what was concealed.",
};

/** Colors for the graph explorer legend, keyed by node type. */
export const NODE_COLORS: Record<NodeType, string> = {
  Person: "#60a5fa", // blue
  Organization: "#34d399", // green
  Document: "#fbbf24", // amber
  Event: "#f472b6", // pink
  Location: "#a78bfa", // violet
  Topic: "#22d3ee", // cyan
  RedactedSpan: "#f87171", // red — the lead
};

/** Convenience: plain string arrays for the LangChain LLMGraphTransformer. */
export const allowedNodes: string[] = [...NODE_TYPES];
export const allowedRelationships: string[] = [...RELATIONSHIP_TYPES];
