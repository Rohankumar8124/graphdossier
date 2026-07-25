import Link from "next/link";
import Stats from "@/components/Stats";
import Reveal from "@/components/Reveal";

const FILE_INDEX = [
  {
    t: "GraphRAG chat",
    d: "semantic search → one-hop graph expansion → streamed answers grounded in the records.",
  },
  {
    t: "Schema-guided extraction",
    d: "Gemini structured output constrained by a typed graph schema — it can't invent a type the graph doesn't know.",
  },
  {
    t: "Entity resolution",
    d: "“Robert Calloway”, “Bob”, and “R. Calloway” collapse into one Person node across the corpus.",
  },
  {
    t: "A real graph API",
    d: "create, search, rename, delete — nodes and relationships over REST, schema-validated like the agent.",
  },
  {
    t: "Live-pipeline uploads",
    d: "drop PDFs and watch parse → extract → resolve → embed → write stream stage-by-stage.",
  },
  {
    t: "Visual explorer",
    d: "the whole graph color-coded by type, redactions ringed in red, every node inspectable.",
  },
  {
    t: "Zero-setup embedded graph",
    d: "Kùzu embedded database, tables generated from the schema — clone, ingest, run. No server.",
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

      {/* Everything it does — case-file spread */}
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

        {/* Two flagship exhibits */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Exhibit A: redactions as data — a hover-declassifiable document */}
          <Reveal className="fx-rise rounded-lg border border-border bg-surface p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Exhibit A
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              <span className="fx-unredact">Redactions as first-class leads</span>
            </h3>
            <p className="mt-2 text-sm text-muted">
              Every blacked-out span becomes a <code>RedactedSpan</code> node with
              its exemption code and context — queryable, visible, chaseable.
              Hover the bars:
            </p>
            <div className="mt-4 rounded-md border border-border bg-background/60 p-4 font-mono text-xs leading-6 text-muted">
              <p className="text-foreground">
                MEMO · Atwater Mill site assessment
              </p>
              <p className="mt-2">
                Sampling at the north lot found{" "}
                <span className="redacted" title="b(4) — hover to declassify">
                  benzene at 40× the limit
                </span>{" "}
                <span className="stamp-chip !text-[9px]">b(4)</span>. Recommend{" "}
                <span className="redacted" title="b(5) — hover to declassify">
                  halting Phase 2 approval
                </span>{" "}
                <span className="stamp-chip !text-[9px]">b(5)</span> pending
                review by{" "}
                <span className="redacted" title="b(6) — hover to declassify">
                  R.&nbsp;Calloway
                </span>{" "}
                <span className="stamp-chip !text-[9px]">b(6)</span>.
              </p>
            </div>
          </Reveal>

          {/* Exhibit B: agent editing — a mini transcript */}
          <Reveal className="fx-rise rounded-lg border border-border bg-surface p-6" delay={120}>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Exhibit B
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              <span className="fx-unredact">Edit the graph by chatting</span>
            </h3>
            <p className="mt-2 text-sm text-muted">
              A LangGraph agent resolves names to nodes and performs
              schema-validated edits — then tells you exactly what changed.
            </p>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-end">
                <span className="rounded-lg rounded-br-sm bg-accent px-3 py-1.5 text-background">
                  connect Alice Vasquez to Acme Corp
                </span>
              </div>
              <div className="flex">
                <div className="rounded-lg rounded-bl-sm border border-border bg-background/60 px-3 py-2 font-mono text-xs leading-5 text-muted">
                  <span className="text-accent">find_nodes</span> → Person:alice-vasquez ·
                  Organization:acme-corp
                  <br />
                  <span className="text-accent">connect_nodes</span> →
                  AFFILIATED_WITH ✓
                  <br />
                  <span className="text-foreground">
                    Connected Alice Vasquez —AFFILIATED_WITH→ Acme Corp.
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* The rest: a dossier index, not boxes */}
        <div className="mt-10 grid gap-x-14 sm:grid-cols-2">
          {FILE_INDEX.map((f, i) => (
            <Reveal
              key={f.t}
              className="fx-rise group flex gap-4 border-b border-border py-4"
              delay={(i % 2) * 80}
            >
              <span className="font-mono text-sm text-accent">
                §{String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-relaxed">
                <span className="font-semibold transition-colors group-hover:text-accent">
                  {f.t}
                </span>{" "}
                <span className="text-muted">— {f.d}</span>
              </p>
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
