/**
 * Graph-editing agent (LangGraph).
 *
 * A ReAct-style tool loop that turns plain-English commands — "delete the node
 * for Bob", "rename Project X to Project Y", "connect Alice to Acme Corp" —
 * into graph mutations. Its tools are thin wrappers over the same service
 * layer the public REST APIs use (`graph-ops.ts`), so the agent can do exactly
 * what the API can do, under the same schema validation, and nothing else.
 */
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getChatModel } from "./gemini";
import {
  findNodes as findNodesOp,
  createNode as createNodeOp,
  renameNode as renameNodeOp,
  deleteNode as deleteNodeOp,
  createEdge as createEdgeOp,
  deleteEdge as deleteEdgeOp,
} from "./graph-ops";
import { NODE_TYPES, RELATIONSHIP_TYPES } from "./graph-schema";

const findNodes = tool(
  async ({ query, type }) => {
    const rows = await findNodesOp(query, type);
    if (!rows.length) return `No nodes matched "${query}".`;
    return rows.map((r) => `${r.id}  (${r.type}: ${r.name})`).join("\n");
  },
  {
    name: "find_nodes",
    description:
      "Search graph nodes by (partial) name. Always use this first to resolve " +
      "the exact node id before deleting, renaming, or connecting anything.",
    schema: z.object({
      query: z.string().describe("Partial or full node name to search for."),
      type: z.enum(NODE_TYPES).optional().describe("Restrict to one node type."),
    }),
  },
);

const createNode = tool(
  async ({ type, name }) => {
    const node = await createNodeOp(type, name);
    return `Created ${node.id} (${node.type}: "${node.name}").`;
  },
  {
    name: "create_node",
    description: "Create a new node of a given type with a display name.",
    schema: z.object({
      type: z.enum(NODE_TYPES).describe("The node type to create."),
      name: z.string().describe("Display name for the new node."),
    }),
  },
);

const renameNode = tool(
  async ({ id, newName }) => {
    await renameNodeOp(id, newName);
    return `Renamed ${id} to "${newName}".`;
  },
  {
    name: "rename_node",
    description: "Rename a node (sets its display name) by exact canonical id.",
    schema: z.object({
      id: z.string().describe("Exact canonical node id."),
      newName: z.string().describe("The new display name."),
    }),
  },
);

const deleteNode = tool(
  async ({ id }) => {
    await deleteNodeOp(id);
    return `Deleted ${id} and all of its relationships.`;
  },
  {
    name: "delete_node",
    description: "Delete a node (and its relationships) by exact canonical id.",
    schema: z.object({ id: z.string().describe("Exact canonical node id.") }),
  },
);

const connectNodes = tool(
  async ({ sourceId, relationship, targetId }) => {
    try {
      await createEdgeOp(sourceId, relationship, targetId);
      return `Connected ${sourceId} -[${relationship}]-> ${targetId}.`;
    } catch (err) {
      return (err as Error).message; // includes what IS allowed for the pair
    }
  },
  {
    name: "connect_nodes",
    description:
      "Create a relationship between two nodes (by exact canonical ids). " +
      "The relationship must be allowed by the graph schema.",
    schema: z.object({
      sourceId: z.string().describe("Exact canonical id of the source node."),
      relationship: z
        .enum(RELATIONSHIP_TYPES)
        .describe("The relationship type."),
      targetId: z.string().describe("Exact canonical id of the target node."),
    }),
  },
);

const disconnectNodes = tool(
  async ({ sourceId, relationship, targetId }) => {
    await deleteEdgeOp(sourceId, relationship, targetId);
    return `Removed ${sourceId} -[${relationship}]-> ${targetId} (if it existed).`;
  },
  {
    name: "disconnect_nodes",
    description:
      "Delete a specific relationship between two nodes (by exact canonical ids).",
    schema: z.object({
      sourceId: z.string(),
      relationship: z.enum(RELATIONSHIP_TYPES),
      targetId: z.string(),
    }),
  },
);

export const MUTATION_TOOLS = new Set([
  "create_node",
  "delete_node",
  "rename_node",
  "connect_nodes",
  "disconnect_nodes",
]);

const AGENT_SYSTEM = [
  "You are the Graphdossier graph editor. The user asks for changes to an",
  "investigative knowledge graph in plain English. Rules:",
  "1. ALWAYS resolve names to exact canonical ids with find_nodes before",
  "   renaming, deleting, or connecting existing nodes. If a name matches",
  "   several nodes, list them and ask which one — do not guess.",
  "2. Perform exactly what was asked — no extra edits.",
  "3. Relationships must respect the graph schema; if a requested link is not",
  "   allowed, relay what is allowed instead.",
  "4. After acting, reply with a short, precise summary of what changed.",
  `Node types: ${NODE_TYPES.join(", ")}.`,
  `Relationship types: ${RELATIONSHIP_TYPES.join(", ")}.`,
].join("\n");

/** Run one graph-editing exchange. Returns the reply plus whether we mutated. */
export async function runGraphEditor(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<{ reply: string; mutated: boolean }> {
  const agent = createReactAgent({
    llm: getChatModel({ temperature: 0 }),
    tools: [
      findNodes,
      createNode,
      renameNode,
      deleteNode,
      connectNodes,
      disconnectNodes,
    ],
    stateModifier: AGENT_SYSTEM,
  });

  const result = await agent.invoke({
    messages: [...history, { role: "user" as const, content: message }],
  });

  const messages = result.messages ?? [];
  let mutated = false;
  for (const m of messages) {
    const calls = (m as { tool_calls?: { name: string }[] }).tool_calls ?? [];
    if (calls.some((c) => MUTATION_TOOLS.has(c.name))) mutated = true;
  }
  const last = messages[messages.length - 1];
  const reply =
    typeof last?.content === "string"
      ? last.content
      : Array.isArray(last?.content)
        ? last.content
            .map((c: unknown) =>
              typeof c === "object" && c && "text" in c
                ? (c as { text: string }).text
                : "",
            )
            .join("")
        : "Done.";
  return { reply, mutated };
}
