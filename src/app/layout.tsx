import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// An editorial serif for headings — the dossier's "typewritten report" voice,
// paired with Geist Sans for body copy and Geist Mono for ids/code.
const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

import Link from "next/link";

export const metadata: Metadata = {
  title: "Graphdossier — map released records",
  description:
    "Turn a pile of released FOIA/RTI documents into a navigable map of who knew what, when — and what's still redacted.",
};

function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-3 w-6 rounded-sm bg-accent" />
          Graphdossier
        </Link>
        <div className="flex items-center gap-1 text-sm text-muted">
          <Link href="/guide" className="rounded px-3 py-1.5 hover:bg-surface-2 hover:text-foreground">
            How to use
          </Link>
          <Link href="/chat" className="rounded px-3 py-1.5 hover:bg-surface-2 hover:text-foreground">
            Ask
          </Link>
          <Link href="/explorer" className="rounded px-3 py-1.5 hover:bg-surface-2 hover:text-foreground">
            Explore
          </Link>
          <Link href="/upload" className="rounded px-3 py-1.5 hover:bg-surface-2 hover:text-foreground">
            Upload
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
