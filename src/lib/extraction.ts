/**
 * Schema-guided extraction pass.
 *
 * Given the text of a single released document, Gemini returns the entities,
 * relationships, and — crucially — the redacted spans it can identify, all
 * constrained to the Graphdossier graph schema. We use structured output with a
 * *fully specified* Zod schema (every field described, flat shapes only),
 * which is what Gemini's function-calling reliably accepts.
 */
import { z } from "zod";
import { getChatModel } from "./gemini";
import {
  NODE_TYPES,
  RELATIONSHIP_TYPES,
  NODE_DESCRIPTIONS,
  ALLOWED_TRIPLES,
} from "./graph-schema";

const EntitySchema = z.object({
  tempId: z
    .string()
    .describe(
      "A short id unique within THIS document (e.g. 'e1', 'e2') used to " +
        "reference the entity from relationships.",
    ),
  type: z.enum(NODE_TYPES).describe("The schema node type for this entity."),
  name: z
    .string()
    .describe(
      "Canonical display name. For a redaction, a short label like " +
        "'Redacted name (b6)'.",
    ),
  role: z
    .string()
    .optional()
    .describe("Person only: job title or role, if stated."),
  email: z
    .string()
    .optional()
    .describe("Person only: email address, if present."),
  date: z
    .string()
    .optional()
    .describe("Document/Event only: ISO date YYYY-MM-DD if determinable."),
  docType: z
    .string()
    .optional()
    .describe("Document only: email | memo | letter | report | minutes."),
  exemptionCode: z
    .string()
    .optional()
    .describe(
      "RedactedSpan only: FOIA/RTI exemption cited next to the redaction, " +
        "e.g. b(5), b(6), b(7)(C). Empty if none stated.",
    ),
  redactionContext: z
    .string()
    .optional()
    .describe(
      "RedactedSpan only: the surrounding sentence and your best inference " +
        "of what kind of thing was concealed.",
    ),
});

const RelationshipSchema = z.object({
  sourceTempId: z.string().describe("tempId of the source entity."),
  type: z
    .enum(RELATIONSHIP_TYPES)
    .describe("The schema relationship type."),
  targetTempId: z.string().describe("tempId of the target entity."),
});

export const ExtractionSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;
export type ExtractedEntity = z.infer<typeof EntitySchema>;
export type ExtractedRelationship = z.infer<typeof RelationshipSchema>;

function buildSystemPrompt(): string {
  const nodeLines = NODE_TYPES.map(
    (t) => `- ${t}: ${NODE_DESCRIPTIONS[t]}`,
  ).join("\n");
  const tripleLines = ALLOWED_TRIPLES.map(
    ([s, r, t]) => `- (${s}) -[${r}]-> (${t})`,
  ).join("\n");
  return [
    "You are an investigative analyst building a knowledge graph from a",
    "released FOIA/RTI document. Extract entities and relationships strictly",
    "within the schema below. Resolve obvious aliases to one canonical name",
    "(e.g. 'Bob', 'Robert J. Smith', and a bare signature 'R. Smith' are the",
    "same Person). Treat every blacked-out / withheld / [REDACTED] passage as",
    "a RedactedSpan node — these are investigative leads, not noise. When a",
    "redaction's context makes the concealed subject inferable, link it with",
    "REDACTION_CONCEALS to the suspected Person/Organization/Topic.",
    "",
    "NODE TYPES:",
    nodeLines,
    "",
    "ALLOWED RELATIONSHIPS (do not invent others):",
    tripleLines,
  ].join("\n");
}

/**
 * Extract a graph fragment from one document's text.
 * `docTitle` / `docDate` seed the Document node so the model anchors
 * relationships to the right record.
 */
export async function extractFromDocument(input: {
  text: string;
  title: string;
  date?: string;
}): Promise<ExtractionResult> {
  const model = getChatModel({ temperature: 0 });
  const structured = model.withStructuredOutput(ExtractionSchema, {
    name: "extract_graph",
  });

  const user = [
    `DOCUMENT TITLE: ${input.title}`,
    input.date ? `DOCUMENT DATE: ${input.date}` : "",
    "",
    "Always include one Document entity for this record itself.",
    "",
    "--- DOCUMENT TEXT ---",
    input.text,
  ]
    .filter(Boolean)
    .join("\n");

  return structured.invoke([
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: user },
  ]);
}
