import Link from "next/link";
import Stats from "@/components/Stats";
import Reveal from "@/components/Reveal";

const FILE_INDEX = [
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
          className="fx-hero text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
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

      {/* The domain: what FOIA/RTI is, and why this needs to exist */}
      <section className="mt-20 grid gap-10 lg:grid-cols-5">
        {/* The law, in one breath */}
        <Reveal className="fx-rise lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            The domain
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-snug">
            What&apos;s a FOIA/RTI release?
          </h2>
          <div className="mt-3 flex gap-2">
            <span className="stamp-chip">FOIA · USA · 1966</span>
            <span className="stamp-chip">RTI · India · 2005</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Transparency laws that let{" "}
            <strong className="text-foreground">any citizen</strong>{" "}
            force the government to hand over its internal records — emails, memos,
            meeting minutes, invoices. It&apos;s how journalists find out what
            officials actually did, not what they announced.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Before release, officials black out passages under legal
            exemptions — and must cite which one next to every bar:
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="stamp-chip">b(4) commercial</span>
            <span className="stamp-chip">b(5) deliberative</span>
            <span className="stamp-chip">b(6) privacy</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            So every <span className="text-accent">black bar is labeled
            evidence</span>: it tells you what <em>kind</em> of thing was
            hidden, right where it was hidden.
          </p>
        </Reveal>

        {/* The need, as case-file findings */}
        <div className="lg:col-span-3">
          <p className="fx-type mt-1 font-mono text-xs uppercase tracking-widest text-muted">
            Why this needs to exist
          </p>
          <div className="mt-3">
            {[
              {
                n: "01",
                t: "Released is not the same as read",
                d: "Millions of pages come out of FOIA/RTI requests every year — and most are read by nobody. Transparency laws only create accountability if someone can actually process what gets released.",
              },
              {
                n: "02",
                t: "The story lives between documents",
                d: "The same consultant on both sides of a deal. A meeting right before a vote. A report that vanishes after one email. Full-text search indexes words; the truth is a network.",
              },
              {
                n: "03",
                t: "What's hidden is the best lead",
                d: "A privacy redaction next to “approved the payment” isn't missing data — it's a signpost. Redaction patterns tell you exactly what to request next. No other tool treats them as data.",
              },
            ].map((f, i) => (
              <Reveal
                key={f.n}
                className="fx-rise border-b border-border py-5 first:border-t"
                delay={i * 110}
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-2xl font-bold text-accent">
                    {f.n}
                  </span>
                  <div>
                    <h3 className="font-semibold">
                      <span className="fx-unredact">{f.t}</span>
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {f.d}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="fx-rise mt-4" delay={330}>
            <p className="text-sm text-muted">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                Built for
              </span>{" "}
              — investigative journalists (weeks of cross-referencing → minutes),
              transparency &amp; civic-tech groups (redaction patterns become
              measurable), policy researchers (primary-source networks with
              citations), and anyone filing the follow-up RTI/FOIA request that
              actually hits.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Live stats */}
      <Reveal as="section" className="fx-rise mt-16">
        <Stats />
      </Reveal>

      {/* THE game changer: the graph-editing agent */}
      <section className="mt-16 grid items-center gap-10 lg:grid-cols-2">
        <Reveal className="fx-rise">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            The game changer
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight">
            Don&apos;t just ask your graph.{" "}
            <span className="text-accent">Tell it.</span>
          </h2>
          <p className="mt-4 text-muted">
            Most knowledge graphs are read-only artifacts. Graphdossier ships a{" "}
            <strong className="text-foreground">
              LangGraph agent with write access
            </strong>{" "}
            — type what you want changed, in plain English, and it happens.
            Delete a duplicate. Rename an alias. Wire two entities together. No
            query language, no forms.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              ["Resolves names to exact nodes before touching anything", ""],
              ["Schema-validated — it cannot create a link the graph forbids", ""],
              ["Runs the same operations as the public REST API, nothing more", ""],
              ["Reports precisely what changed, every time", ""],
            ].map(([b]) => (
              <li key={b} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="text-muted">{b}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/chat"
            className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Command the graph →
          </Link>
        </Reveal>

        {/* live-feel transcript, the only glowing card on the page */}
        <Reveal
          className="fx-rise glow-accent rounded-xl border bg-surface p-5"
          delay={140}
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            /chat · live session
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-end">
              <span className="rounded-lg rounded-br-sm bg-accent px-3 py-1.5 text-background">
                connect Alice Vasquez to Acme Corp
              </span>
            </div>
            <div className="flex">
              <div className="rounded-lg rounded-bl-sm border border-border bg-background/60 px-3 py-2 font-mono text-xs leading-5 text-muted">
                <span className="text-accent">find_nodes</span> →
                Person:alice-vasquez · Organization:acme-corp
                <br />
                <span className="text-accent">connect_nodes</span> →
                AFFILIATED_WITH ✓
                <br />
                <span className="text-foreground">
                  Connected Alice Vasquez —AFFILIATED_WITH→ Acme Corp.
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <span className="rounded-lg rounded-br-sm bg-accent px-3 py-1.5 text-background">
                link the lab report to Riverside Fund
              </span>
            </div>
            <div className="flex">
              <div className="rounded-lg rounded-bl-sm border border-border bg-background/60 px-3 py-2 font-mono text-xs leading-5 text-muted">
                <span className="text-accent">connect_nodes</span> → ✗ schema
                violation
                <br />
                <span className="text-foreground">
                  A Document can&apos;t link to an Organization that way — allowed:
                  MENTIONS. Want me to use that?
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted">
            The schema is the guardrail: the agent physically can&apos;t corrupt the
            graph — it negotiates instead.
          </p>
        </Reveal>
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

          {/* Exhibit B: GraphRAG Q&A — grounded answers */}
          <Reveal className="fx-rise rounded-lg border border-border bg-surface p-6" delay={120}>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Exhibit B
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              <span className="fx-unredact">Ask, and get grounded answers</span>
            </h3>
            <p className="mt-2 text-sm text-muted">
              Semantic search finds the documents, one-hop graph expansion pulls
              in connected entities and redactions, and the answer streams back
              citing the records.
            </p>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-end">
                <span className="rounded-lg rounded-br-sm bg-accent px-3 py-1.5 text-background">
                  who buried the contamination report?
                </span>
              </div>
              <div className="flex">
                <div className="rounded-lg rounded-bl-sm border border-border bg-background/60 px-3 py-2 text-xs leading-5 text-muted">
                  The lab summary (gf-003) reached{" "}
                  <span className="text-foreground">R. Calloway</span> on May 2;
                  the closed-session minutes (gf-004) show the finding was
                  dropped from the agenda — the deciding exchange sits behind a{" "}
                  <span className="text-accent">b(5) redaction</span> linked to
                  the same meeting.
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
