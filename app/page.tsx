import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const statHighlights = [
  {
    value: "1100+",
    label: "Research papers published",
  },
  {
    value: "400+",
    label: "Books & book chapters",
  },
  {
    value: "200+",
    label: "Ph.D. degrees awarded",
  },
  {
    value: "150+",
    label: "Patents granted / published",
  },
];

const servicePillars = [
  {
    title: "Admissions excellence",
    body: "NET/JRF, RAT, and institutional intakes funnel into one workflow with interview, offer, and fee orchestration.",
  },
  {
    title: "Mentorship alignment",
    body: "Supervisors receive unified milestones, meeting decisions, and compliance nudges for every scholar.",
  },
  {
    title: "Industry partnerships",
    body: "Consultancy proposals, NDAs, and deliverables stay visible for leadership and finance teams alike.",
  },
  {
    title: "Funding intelligence",
    body: "Scholarships, grants, and project disbursements run through a transparent digital ledger.",
  },
  {
    title: "Document assurance",
    body: "Versioned submissions, similarity checks, and audit logs keep every statutory requirement on record.",
  },
  {
    title: "Omni-channel communications",
    body: "Tenant-scoped threads, announcements, and reminders keep scholars, supervisors, and admins aligned.",
  },
];

const subjectAreas = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "English",
  "Psychology",
  "Sociology",
  "Political Science",
  "Social Work",
  "Public Health",
  "Legal Studies",
  "Management",
  "Commerce",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical & Electronics Engineering",
  "Computer Science",
  "Bio-Sciences",
  "Biotechnology",
  "Media Studies",
  "Horticulture (Fruit Science)",
  "Agronomy",
  "Education",
];

const assurancePoints = [
  "RAT schedule will be announced shortly with centralized notifications",
  "Applicants holding NET/JRF/M.Phil qualifications are invited directly for interviews",
  "Admissions are governed by SRMU's statutory and NAAC-aligned processes",
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.9)_0%,rgba(216,235,255,0.75)_35%,rgba(154,198,250,0.6)_60%,rgba(88,150,230,0.45)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(243,180,72,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(231,63,50,0.2),transparent_60%)]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-10 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <Image
            src="/Header.png"
            alt="Shri Ramswaroop Memorial University logo"
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded-full border border-white/60 bg-white/95 p-1 shadow-lg shadow-primary/30"
          />
          <div className="space-y-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-primary/80">
              Shri Ramswaroop Memorial University
            </p>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Research & Consultancy Cell
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Register</Link>
          </Button>
          <Button asChild>
            <Link href="https://phdadmission.srmu.ac.in/" target="_blank" rel="noreferrer">
              Apply Now
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-24 sm:px-8 lg:px-12">
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Admissions Open · 2025-26 (Even Semester)
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Ph.D. Programme powered by the Research & Consultancy Cell.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              A single digital command center that unifies admissions, scholar lifecycle management, consultancy projects, and statutory reporting for Shri Ramswaroop Memorial University.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Apply Online
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Applicant Workspace</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">RAT:</span> dates will be communicated officially.
              </div>
              <div>
                <span className="font-semibold text-foreground">NET/JRF/M.Phil:</span> direct interview invitations.
              </div>
              <div>
                <span className="font-semibold text-foreground">Location:</span> Lucknow-Deva Road, Uttar Pradesh.
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl shadow-primary/20 backdrop-blur">
              <div className="flex items-center gap-4">
                <Image
                  src="/Header.png"
                  alt="Research & Consultancy Cell seal"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-border bg-white/95 p-1"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    SRMU Ph.D. Programme
                  </p>
                  <p className="text-base font-semibold text-foreground">Research & Consultancy Impact</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                22 research & consultancy projects have secured ₹2.90+ Crores in funding with global collaborations, supervised from a single workspace.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {statHighlights.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border/50 bg-muted/40 px-4 py-4 shadow-inner shadow-primary/10"
                  >
                    <p className="text-3xl font-semibold text-primary">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4">
                <p className="text-sm font-semibold text-primary">Research & Consultancy Projects</p>
                <p className="text-2xl font-bold text-foreground">
                  22 <span className="text-base font-medium text-muted-foreground">(₹2.90+ Crores)</span>
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card/80 p-6 backdrop-blur">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Assurance
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {assurancePoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-border/60 bg-card/80 p-8 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
              Subject Areas
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Interdisciplinary depth across science, engineering, management, and the humanities.
            </h2>
            <p className="text-sm text-muted-foreground">
              Scholars collaborate with expert supervisors across SRMU schools to build impactful, industry-ready research output.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectAreas.map((subject) => (
              <div
                key={subject}
                className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/70 px-4 py-3 text-sm font-medium"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>{subject}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
              Why Partner With Us
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              A modern operating system for doctoral research and consultancy delivery.
            </h2>
            <p className="text-sm text-muted-foreground">
              Built on Next.js, Prisma, and secure cloud infrastructure, the Research & Consultancy Cell provides transparent workflows for every persona.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicePillars.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/50 bg-card/90 p-6 shadow-inner shadow-primary/5"
              >
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-gradient-to-r from-primary/90 via-primary to-accent/80 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.4fr_1fr_auto] lg:items-center lg:gap-10">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
                Next Steps
              </p>
              <h3 className="text-3xl font-semibold">
                Plan your doctoral journey with SRMU's Research & Consultancy Cell.
              </h3>
              <p className="text-sm text-white/80">
                Talk to our admissions desk for programme guidance, RAT updates, and collaboration opportunities.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl bg-white/10 p-4 text-sm shadow-inner lg:justify-self-center lg:text-base">
              <p>
                Ph.D. enquiries: <Link href="tel:+917784940188" className="font-semibold underline whitespace-nowrap">+91-77849 40188</Link>
              </p>
              <p>
                Other courses: <Link href="tel:+18001026004" className="font-semibold underline whitespace-nowrap">1800-102-6004</Link>
              </p>
              <p>
                Website: <Link href="https://www.srmu.ac.in" target="_blank" rel="noreferrer" className="font-semibold underline">www.srmu.ac.in</Link>
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:justify-self-end">
              <Button size="lg" variant="secondary" asChild className="text-primary bg-secondary text-base font-semibold">
                <Link href="/register">
                  Begin Application
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/60 text-white hover:text-primary text-base font-semibold">
                <Link href="mailto:info@srmu.ac.in">Email Admissions</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-12 text-xs text-muted-foreground sm:px-8 lg:px-12">
        © {new Date().getFullYear()} Research & Consultancy Cell · Shri Ramswaroop Memorial University.
      </footer>
    </div>
  );
}
