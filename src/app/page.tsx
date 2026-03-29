import { ArrowRight, Calendar, Database, Kanban, Layers, Search, Sparkles, Table2, Type } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verso — Your workspace, your way",
  description:
    "A production-grade Notion alternative with a block editor, databases, kanban boards, and calendar views. Clean, fast, and beautifully designed.",
  openGraph: {
    title: "Verso — Your workspace, your way",
    description: "A production-grade Notion alternative with a block editor, databases, and beautiful views.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Type,
    title: "Block Editor",
    description: "Rich text, headings, lists, code blocks, callouts, toggles — everything you need to write beautifully.",
  },
  {
    icon: Database,
    title: "Databases",
    description: "Inline databases with 10 property types, filters, sorts, and grouping. Your data, structured your way.",
  },
  {
    icon: Table2,
    title: "Table View",
    description: "Spreadsheet-like tables with resizable columns, inline editing, and custom date pickers.",
  },
  {
    icon: Kanban,
    title: "Board View",
    description: "Drag-and-drop kanban boards with color-coded columns. Move cards between statuses effortlessly.",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description: "See your data on a month grid. Add items directly to dates. Navigate months with ease.",
  },
  {
    icon: Layers,
    title: "Gallery View",
    description: "Visual card grid with image previews. Perfect for portfolios, mood boards, and content collections.",
  },
];

const STEPS = [
  { step: "1", title: "Create a page", description: "Start with a blank canvas. Add a title, pick an icon." },
  { step: "2", title: "Add blocks", description: "Type / to insert any block — text, database, image, code, and more." },
  { step: "3", title: "Organise", description: "Nest pages, add to favorites, search instantly with Cmd+K." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-mark.svg" alt="Verso" width={28} height={28} />
          <span className="text-lg font-bold tracking-tight">Verso</span>
        </Link>
        <Link
          href="/workspace"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Open Workspace
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/30 bg-muted/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Open source Notion alternative
        </div>

        <h1 className="text-5xl font-black leading-[1.08] tracking-[-0.04em] text-foreground sm:text-6xl">
          Your workspace,
          <br />
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            your way.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          A beautifully crafted block editor with databases, kanban boards, calendars, and galleries.
          Clean, fast, and endlessly flexible.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/workspace"
            className="group flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 hover:gap-3"
          >
            Start writing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://github.com/Serious-Projects/verso"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border/40 px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            View on GitHub
          </a>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-border/20 shadow-2xl">
        <div className="aspect-video bg-gradient-to-br from-muted/30 via-muted/10 to-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground/30">App screenshot placeholder</p>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-t border-border/10 bg-muted/5 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">
            Everything you need, nothing you don&apos;t.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Powerful features with a clean, minimal interface.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/15 bg-background p-6 transition-all duration-200 hover:border-border/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 text-foreground/70 transition-colors group-hover:bg-amber-500/10 group-hover:text-amber-600">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">
            Get started in seconds.
          </h2>
          <p className="mt-3 text-muted-foreground">
            No signup required. Just open and start writing.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.step} className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-md">
                {step.step}
              </div>
              <h3 className="text-sm font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground/70">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-border/10 bg-muted/5 py-24">
      <div className="mx-auto max-w-2xl text-center px-6">
        <h2 className="text-3xl font-bold tracking-[-0.03em]">
          Ready to build your workspace?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Free, open source, and runs entirely in your browser. No account needed.
        </p>
        <Link
          href="/workspace"
          className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90 hover:gap-3"
        >
          Open Verso
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/10 py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
          <Image src="/images/logo-mark.svg" alt="Verso" width={18} height={18} className="opacity-50" />
          <span>Verso</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground/40">
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
          <a
            href="https://github.com/Serious-Projects/verso"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
