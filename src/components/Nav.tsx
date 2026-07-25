"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/guide", full: "How to use", short: "Guide" },
  { href: "/chat", full: "Ask", short: "Ask" },
  { href: "/explorer", full: "Explore", short: "Explore" },
  { href: "/upload", full: "Upload", short: "Upload" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="stamp-chip !px-1.5 !py-0.5 !text-[9px]">FA</span>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Graphdossier
          </span>
        </Link>
        <div className="flex items-center gap-0.5 overflow-x-auto sm:gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 border-b-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors sm:px-3 sm:text-xs ${
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:border-border hover:text-foreground"
                }`}
              >
                <span className="hidden sm:inline">{l.full}</span>
                <span className="sm:hidden">{l.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
