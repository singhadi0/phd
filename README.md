# Research X PhD Management Platform

Research X is a multi-tenant PhD lifecycle platform that serves scholars, supervisors, administrators, and developers. The stack is built on Next.js App Router, Prisma, and PostgreSQL with NextAuth credentials and Shadcn UI.

## Feature Highlights

- Tenant-scoped auth with role-aware redirects and dashboard shells
- Admin tooling for program catalogs, course creation, scholar invitations, fee ledgers, and enrollments
- Scholar dashboard summarising onboarding progress, finances, coursework, documents, and meetings
- Seed data representing a demo university, seeded roles, and example timelines for smoke testing

## Tech Stack

- Next.js 15 (App Router, server actions)
- TypeScript + ESLint flat config
- Prisma ORM on PostgreSQL
- NextAuth credentials provider with argon2 hashing
- Shadcn UI + Tailwind CSS v4 tokens

## Prerequisites

- Node.js 20+
- pnpm 9 (preferred) or npm
- PostgreSQL 15+ running locally or remotely

## Local Setup

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`
3. Run migrations: `pnpm prisma migrate dev --name init`
4. Seed demo data: `pnpm prisma db seed`
5. Start development server: `pnpm dev`

Visit `http://localhost:3000` and sign in with one of the seeded accounts:

- Admin: `admin@researchx.test` / `Password123!`
- Supervisor: `supervisor@researchx.test` / `Password123!`
- Scholar: `scholar@researchx.test` / `Password123!`
- Developer: `developer@researchx.test` / `Password123!`

## Useful Scripts

- `pnpm lint` — run ESLint with type-aware rules
- `pnpm prisma studio` — open Prisma Studio for ad-hoc data inspection
- `pnpm prisma migrate dev --name <label>` — add a schema migration
- `pnpm prisma db seed` — reseed the database (destructive for existing data)

## Project Structure

- `app/` — Next.js App Router tree (public auth, tenant dashboards, API routes)
- `components/` — Shadcn UI primitives and shared components
- `lib/` — server utilities, Prisma data access, auth helpers, dashboard summaries
- `prisma/` — schema and seed script
- `Revised Research X/` — product discovery artefacts and requirement references

Keep the development playbook in `development-doc.md` up to date when major workflows or dependencies change.
