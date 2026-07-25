import Link from "next/link";
import Stats from "@/components/Stats";

const FEATURES = [
  {
    t: "Schema-guided extraction",
    d: "Gemini structured output constrained by a typed graph schema — Person, Organization, Document, Event, Location, Topic, RedactedSpan. The model can't invent a type the graph doesn't know.",
  },
  {
    t: "Redactions as first-class leads",
    d: "Every blacked-out span becomes a RedactedSpan node carrying its exemption code (b4, b5, b6…) and surrounding context — queryable, visible, chaseable.",
  },
  {
    t: "GraphRAG chat",
    d: "Ask in plain English. Semantic search finds the documents, one-hop graph expansion pulls in connected entities and redactions, and the answer streams back grounded in the records.",
  },
  {
    t: "Edit the graph by chatting",
    d: "“Delete the node for Bob”, “rename Project X”, “connect Alice to Acme” — a LangGraph agent resolves names to nodes and performs schema-validated edits, then tells you exactly what changed.",
  },
  {
    t: "A real graph API",
    d: "Create, search, rename, and delete nodes and relationships over REST — the same operations the agent uses, schema-validated the same way.",
  },
  {
    t: "Live-pipeline uploads",
    d: "Drop PDFs or text into the running app and watch parse → extract → resolve → embed → write stream stage-by-stage, per file.",
  },
  {
    t: "Visual explorer",
    d: "The whole graph, color-coded by type, with redactions ringed in red. Click any node to inspect it; follow the meeting chains.",
  },
  {
    t: "Entity resolution",
    d: "“Robert Calloway”, “Bob”, and a bare signature “R. Calloway” collapse into one Person node — across every document in the corpus.",
  },
  {
    t: "Zero-setup embedded graph",
    d: "The database is embedded (Kùzu) and its typed tables are generated from the schema. No server to install, nothing to host — clone, ingest, run.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
          GraphRAG for released records
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Turn a document dump into a map of{" "}
          <span className="text-accent-2">who knew what, when</span> — and what&apos;s
          still{" "}
          <span className="redacted" title="Hover to declassify">
            classified
          </span>
          .
        </h1>
        <p className="mt-3 text-sm text-muted">
          <span className="text-accent">↑ Yes, that&apos;s a real redaction — hover
          it to declassify.</span>{" "}
          Around here, blacked-out text isn&apos;t missing data. It <em>is</em> data.
        </p>
        <p className="mt-5 text-lg text-muted">
          Graphdossier reads released FOIA/RTI documents, extracts the people,
          organizations, meetings and topics into a knowledge graph, and treats
          every <strong className="text-accent">redaction as a first-class
          lead</strong> you can query. Ask questions in plain English, get answers
          grounded in the records — or tell the agent to reshape the graph itself.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Ask the records
          </Link>
          <Link
            href="/explorer"
            className="rounded-md border border-border bg-surface px-5 py-2.5 font-medium hover:bg-surface-2"
          >
            Explore the graph
          </Link>
          <Link
            href="/upload"
            className="rounded-md border border-border bg-surface px-5 py-2.5 font-medium hover:bg-surface-2"
          >
            Upload documents
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <section className="mt-12">
        <Stats />
      </section>

      {/* How it works */}
      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            n: "01",
            t: "Extract",
            d: "Gemini reads each document against a fixed graph schema — Person, Organization, Document, Event, Topic, and RedactedSpan — resolving aliases as it goes.",
          },
          {
            n: "02",
            t: "Connect",
            d: "Entities and relationships are merged into an embedded Kùzu knowledge graph. The same person across dozens of emails collapses into one node.",
          },
          {
            n: "03",
            t: "Investigate",
            d: "Ask questions over a GraphRAG retriever, walk the graph visually, or edit it by chat. Redactions surface as red nodes — the leads worth chasing.",
          },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <div className="font-mono text-sm text-accent">{s.n}</div>
            <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm text-muted">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Everything it does */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">
          Everything in the box<span className="text-accent">.</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          One pipeline, one typed schema, one graph — read it, question it,
          reshape it.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.t}
              className="rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
            >
              <div className="h-1 w-8 rounded-full bg-accent" />
              <h3 className="mt-3 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo dataset note */}
      <section className="mt-16 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">The demo corpus: Project Greenfield</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The bundled dataset is a synthetic release in which a fictional city
          fast-tracks a riverside development while a contamination finding is
          quietly buried. It contains planted aliases, a hidden meeting chain, an
          undisclosed dual-role consultant, and exemption-coded redactions
          (b4/b5/b6) — so every feature of the engine fires predictably. The same
          pipeline runs on real public sets like the Clinton email release, the
          FBI Vault, or MuckRock dumps.
        </p>
      </section>
    </div>
  );
}
