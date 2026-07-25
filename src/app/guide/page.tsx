import Link from "next/link";
import Reveal from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    t: "Get your release",
    d: "File (or already have) a FOIA/RTI request and receive the government's response — a PDF bundle, a folder of scanned letters, or a plain-text dump. Graphdossier works on the released files as-is, redactions and all.",
  },
  {
    n: "02",
    t: "Split it into documents",
    d: "One file per record works best — a memo, a single email, one set of meeting minutes. If your release is one giant merged PDF, split it into logical documents first (any PDF tool) so each becomes its own node with its own date and source.",
  },
  {
    n: "03",
    t: "Drop them on /upload",
    d: "Drag in as many PDFs or .txt files as you have — or paste text straight from an OCR tool or a copy-paste. Watch the live pipeline: parse → extract → resolve → embed → write, per file, with a running node/edge count.",
  },
  {
    n: "04",
    t: "Let Gemini read for you",
    d: "Each document is read against the graph schema: people, organizations, meetings, topics — and every black bar becomes a RedactedSpan carrying its exemption code and surrounding context. Aliases resolve automatically across every file you've uploaded.",
  },
  {
    n: "05",
    t: "Ask, don't search",
    d: "On /chat, ask in plain English — “who was at the meeting before the vote?”, “what’s hidden behind the b(5) redactions?”. Answers are grounded in your specific documents and cite them by title.",
  },
  {
    n: "06",
    t: "Walk the graph",
    d: "On /explorer, see the whole network — filter by type, hover any node to spotlight its connections, and follow a redaction back to the meeting or memo it sits in.",
  },
  {
    n: "07",
    t: "Clean up as you go",
    d: "Extraction isn't perfect — if it merges two people who share a name, or misses an obvious link, just say so in chat: “rename this node”, “these are different people, split them”, “connect X to Y”. The agent edits the graph on your instruction.",
  },
];

const FORMATS = [
  ["PDF", "Native or scanned — pdf-parse extracts the text layer. Scanned images with no text layer need OCR first (see below)."],
  [".txt", "Plain text — the fastest path if you've already transcribed or OCR'd a document."],
  ["Pasted text", "No file at all: paste straight into the /upload text box for a one-off email or a quote you're tracking down."],
];

const SOURCES = [
  ["Government FOIA portals", "foia.gov (federal agencies), agency-specific reading rooms, and state/local portals."],
  ["RTI replies", "The scanned PDF an Indian public authority sends back under Section 6/7 of the RTI Act."],
  ["MuckRock / DocumentCloud", "Crowdsourced FOIA request archives — thousands of already-released sets to practice on."],
  ["FBI Vault / National Archives", "Bulk historical releases, often merged into single large PDFs — split before uploading."],
];

export default function Guide() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <Reveal className="fx-rise">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Field manual
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          How to run your own investigation
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          A step-by-step for journalists, researchers, and anyone sitting on a
          fresh FOIA/RTI release — from raw documents to a graph you can
          question.
        </p>
      </Reveal>

      {/* The workflow */}
      <section className="mt-14">
        {STEPS.map((s, i) => (
          <Reveal
            key={s.n}
            className="fx-rise flex gap-5 border-b border-border py-6 first:border-t"
            delay={(i % 4) * 70}
          >
            <span className="font-mono text-2xl font-bold text-accent">
              {s.n}
            </span>
            <div>
              <h2 className="font-semibold">
                <span className="fx-unredact">{s.t}</span>
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                {s.d}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* What you can upload */}
      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <Reveal className="fx-rise">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Accepted formats
          </p>
          <h2 className="mt-2 text-xl font-bold">What you can drop on /upload</h2>
          <div className="mt-4 space-y-4">
            {FORMATS.map(([t, d]) => (
              <div key={t} className="flex gap-3">
                <span className="stamp-chip h-fit shrink-0">{t}</span>
                <p className="text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-border bg-surface p-4 text-sm">
            <p className="text-accent">Scanned, no text layer?</p>
            <p className="mt-1 text-muted">
              Run it through an OCR tool first (Adobe Acrobat, Google Drive&apos;s
              built-in OCR, or a free tool like OCRmyPDF) so the text is
              selectable, then upload the result — Graphdossier needs machine-
              readable text, not just an image of a page.
            </p>
          </div>
        </Reveal>

        <Reveal className="fx-rise" delay={100}>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Where to find real releases
          </p>
          <h2 className="mt-2 text-xl font-bold">Practice on the real thing</h2>
          <div className="mt-4">
            {SOURCES.map(([t, d]) => (
              <div key={t} className="border-b border-border py-3 first:pt-0 last:border-0">
                <p className="text-sm font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Tips */}
      <Reveal
        as="section"
        className="fx-rise mt-16 rounded-lg border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">
          Three things that make extraction better
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm">
          {[
            "Keep document titles descriptive (\"Memo — Atwater Mill site assessment, 2024-03-12\") — they become the node label and the chat citation.",
            "Upload chronologically when you can. Dates seed the Event/Document nodes and make “what happened before X?” answerable.",
            "One redaction per exemption code, if the source lets you tell — it keeps investigative leads distinct instead of merged.",
          ].map((tip) => (
            <li key={tip} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="text-muted">{tip}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/upload"
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90"
        >
          Upload your first document
        </Link>
        <Link
          href="/chat"
          className="rounded-md border border-border bg-surface px-5 py-2.5 font-medium hover:bg-surface-2"
        >
          Try the demo corpus on /chat
        </Link>
      </div>
    </div>
  );
}
