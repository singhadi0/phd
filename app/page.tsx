import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const personaHighlights = [
  {
    title: "Scholar",
    description:
      "Track milestones, fees, scholarship disbursement, and committee feedback.",
  },
  {
    title: "Supervisor",
    description: "Centralize meeting notes, action items, and document reviews.",
  },
  {
    title: "Admin",
    description:
      "Oversee admissions funnels, compliance audits, and financial operations.",
  },
];

const capabilityTiles = [
  {
    title: "Admissions orchestration",
    body: "Custom pipelines for NET/JRF, GATE, and internal exams with automated offer workflows.",
  },
  {
    title: "Communication hub",
    body: "Tenant-scoped messaging threads keep scholars, supervisors, and admins aligned.",
  },
  {
    title: "Document intelligence",
    body: "Versioned submissions, review trails, and instant status insights for compliance.",
  },
  {
    title: "Scholarship ledger",
    body: "Track funding sources, scheduled disbursements, and proof uploads with precision.",
  },
  {
    title: "Audit ready",
    body: "Automatic audit logs, role-based permissions, and secure storage by default.",
  },
  {
    title: "Developer friendly",
    body: "Prisma, Next.js App Router, and typed APIs keep your team shipping fast.",
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-transparent to-transparent dark:from-primary/25" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-10 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/30 dark:bg-primary/20">
            RX
          </span>
          Research X
        </div>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-24 sm:px-8 lg:px-12">
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground shadow-sm">
              Multi-Tenant PhD Management Platform
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Empower scholars, supervisors, and administrators with a single command center.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Research X streamlines admissions, supervision, documents, scholarships, and analytics across every department and campus. Built for collaboration, compliance, and scale.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Create a tenant</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Access your workspace</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <span>Secure RBAC</span>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span>Audit-ready</span>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span>Realtime insights</span>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-primary/15 backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Unified dashboards
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Scholars track milestones, supervisors manage meetings, and admins steer the entire program—all inside the same workspace.
              </p>
              <div className="mt-6 grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3">
                  <span>Admissions pipeline</span>
                  <span className="text-primary">Live</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3">
                  <span>Scholarship ledger</span>
                  <span className="text-primary">Synced</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3">
                  <span>Document approvals</span>
                  <span className="text-primary">Workflow</span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Persona views
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {personaHighlights.map((highlight) => (
                  <li key={highlight.title} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary/60" />
                    <span>
                      <strong className="font-semibold text-foreground">
                        {highlight.title}:
                      </strong>{" "}
                      {highlight.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-8 rounded-3xl border border-border/70 bg-card/80 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold text-foreground">
            Everything you need to run a modern research program.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilityTiles.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/60 bg-background/70 p-6 shadow-inner shadow-primary/10">
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-12 text-xs text-muted-foreground sm:px-8 lg:px-12">
        © {new Date().getFullYear()} Research X. Built for ambitious doctoral programs.
      </footer>
    </div>
  );
}
