/**
 * Ingestion CLI: builds the Graphdossier graph from a corpus directory.
 *
 *   pnpm ingest                       # ingest the bundled Project Greenfield corpus
 *   pnpm ingest --reset               # wipe the graph first, then ingest
 *   pnpm ingest --dir corpus/other    # ingest a different manifest directory
 *
 * Loads env from .env.local, ensures the graph tables,
 * then runs each document through extract → resolve → embed → write.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, resetGraph, closeGraph } from "../src/lib/graphdb";
import { ingestDocument, type DocInput } from "../src/lib/ingest";

interface Manifest {
  collection: string;
  documents: { id: string; file: string; title: string; date?: string }[];
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const dirIdx = args.indexOf("--dir");
  const dir = dirIdx >= 0 ? args[dirIdx + 1] : "corpus/greenfield";

  const manifestPath = path.join(dir, "manifest.json");
  const manifest: Manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  console.log(`\n📚 Collection: ${manifest.collection}`);
  console.log(`   ${manifest.documents.length} documents from ${dir}\n`);

  if (reset) {
    console.log("🧹 Resetting graph…");
    await resetGraph();
  }

  console.log("🔧 Ensuring graph tables…");
  await ensureSchema();

  let totals = { nodes: 0, edges: 0, redactions: 0 };
  for (const d of manifest.documents) {
    const text = await readFile(path.join(dir, d.file), "utf8");
    const doc: DocInput = {
      id: d.id,
      title: d.title,
      text,
      date: d.date,
      source: d.file,
    };
    process.stdout.write(`   • ${d.id} … `);
    const r = await ingestDocument(doc);
    totals = {
      nodes: totals.nodes + r.nodes,
      edges: totals.edges + r.edges,
      redactions: totals.redactions + r.redactions,
    };
    console.log(`${r.nodes} nodes, ${r.edges} edges, ${r.redactions} redactions`);
  }

  console.log(
    `\n✅ Done. ~${totals.nodes} nodes, ${totals.edges} edges, ` +
      `${totals.redactions} redacted spans (pre-merge counts).`,
  );
  await closeGraph();
}

main().catch(async (err) => {
  console.error("\n❌ Ingestion failed:\n", err);
  await closeGraph();
  process.exit(1);
});
