import Link from "next/link";
import Stats from "@/components/Stats";

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
          still <span className="redacted">classified████</span>.
        </h1>
        <p className="mt-5 text-lg text-muted">
          Graphdossier reads released FOIA/RTI documents, extracts the people,
          organizations, meetings and topics into a knowledge graph, and treats
          every <strong className="text-accent">redaction as a first-class
          lead</strong> you can query. Then ask questions in plain English and
          get answers grounded in the records.
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
            d: "Gemini reads each document against a fixed ontology — Person, Organization, Document, Event, Topic, and RedactedSpan — resolving aliases as it goes.",
          },
          {
            n: "02",
            t: "Connect",
            d: "Entities and relationships are merged into a Neo4j knowledge graph. The same person across dozens of emails collapses into one node.",
          },
          {
            n: "03",
            t: "Investigate",
            d: "Ask questions over a GraphRAG retriever, or walk the graph visually. Redactions surface as red nodes — the leads worth chasing.",
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
