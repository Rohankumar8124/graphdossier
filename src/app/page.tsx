import Link from "next/link";
import Stats from "@/components/Stats";
import Reveal from "@/components/Reveal";

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
      {/* scroll-progress ink line (CSS scroll-driven) */}
      <div className="fx-trail" aria-hidden />

      {/* Hero */}
      <section className="max-w-3xl">
        <p
          className="fx-hero mb-3 text-sm font-medium uppercase tracking-widest text-accent"
          style={{ "--fx-delay": "0ms" } as React.CSSProperties}
        >
          GraphRAG for released records
        </p>
        <h1
          className="fx-hero text-4xl font-bold leading-tight sm:text-5xl"
          style={{ "--fx-delay": "90ms" } as React.CSSProperties}
        >
          Turn a document dump into a map of{" "}
          <span className="text-accent-2">who knew what, when</span> — and what&apos;s
          still{" "}
          <span className="redacted" title="Hover to declassify">
            classified
          </span>
          .
        </h1>
        <p
          className="fx-hero mt-3 text-sm text-muted"
          style={{ "--fx-delay": "200ms" } as React.CSSProperties}
        >
          <span className="text-accent">↑ Yes, that&apos;s a real redaction — hover
          it to declassify.</span>{" "}
          Around here, blacked-out text isn&apos;t missing data. It <em>is</em> data.
        </p>
        <p
          className="fx-hero mt-5 text-lg text-muted"
          style={{ "--fx-delay": "300ms" } as React.CSSProperties}
        >
          Graphdossier reads released FOIA/RTI documents, extracts the people,
          organizations, meetings and topics into a knowledge graph, and treats
          every <strong className="text-accent">redaction as a first-class
          lead</strong> you can query. Ask questions in plain English, get answers
          grounded in the records — or tell the agent to reshape the graph itself.
        </p>
        <div
          className="fx-hero mt-8 flex flex-wrap gap-3"
          style={{ "--fx-delay": "420ms" } as React.CSSProperties}
        >
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
      <Reveal as="section" className="fx-rise mt-12">
        <Stats />
      </Reveal>

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
        ].map((s, i) => (
          <Reveal
            key={s.n}
            className="fx-rise rounded-lg border border-border bg-surface p-5"
            delay={i * 120}
          >
            <div className="font-mono text-sm text-accent">{s.n}</div>
            <h3 className="mt-2 text-lg font-semibold">
              <span className="fx-unredact">{s.t}</span>
            </h3>
            <p className="mt-2 text-sm text-muted">{s.d}</p>
          </Reveal>
        ))}
      </section>

      {/* Everything it does */}
      <section className="mt-16">
        <Reveal className="fx-rise">
          <h2 className="text-2xl font-bold">
            Everything in the box{" "}
            <span className="fx-stamp stamp-chip">Declassified</span>
          </h2>
          <p className="fx-type mt-2 max-w-2xl text-sm text-muted">
            One pipeline, one typed schema, one graph — read it, question it,
            reshape it.
          </p>
        </Reveal>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.t}
              className="fx-rise rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
              delay={(i % 3) * 90}
            >
              <div className="h-1 w-8 rounded-full bg-accent" />
              <h3 className="mt-3 font-semibold">
                <span className="fx-unredact">{f.t}</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Demo dataset note */}
      <Reveal
        as="section"
        className="fx-rise mt-16 rounded-lg border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">
          The demo corpus: Project Greenfield{" "}
          <span className="fx-stamp stamp-chip">Synthetic</span>
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The bundled dataset is a synthetic release in which a fictional city
          fast-tracks a riverside development while a contamination finding is
          quietly buried. It contains planted aliases, a hidden meeting chain, an
          undisclosed dual-role consultant, and exemption-coded redactions
          (b4/b5/b6) — so every feature of the engine fires predictably. The same
          pipeline runs on real public sets like the Clinton email release, the
          FBI Vault, or MuckRock dumps.
        </p>
      </Reveal>
    </div>
  );
}
