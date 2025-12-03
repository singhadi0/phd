# Copilot Instructions for phd

These notes orient AI contributors so they can ship features fast without asking for basic context.

## Product & Scope

- Research X is a multi-tenant PhD management platform with dashboards for scholar, supervisor, admin, and developer personas plus public auth/register flows.
- Persistence is Prisma + PostgreSQL; UI is Next.js App Router with Shadcn components and Tailwind v4 tokens.
- Every tenant-owned record carries `tenantId`; RBAC and routing must always honor the active tenant + role context.

## Architecture & Routing

- App Router structure: public pages under `app/(public)`, tenant dashboards under `app/(tenant)/[tenantSlug]/**`; keep persona shells in `(dashboard)` with shared `DashboardShell` layout (`app/(tenant)/[tenantSlug]/(dashboard)/_components/dashboard-shell.tsx`).
- Server components default: layouts/pages call async helpers (e.g. `getAdminDashboardSummary`) and guard access via `requireSession` + `ensureTenantMembership` before doing work.
- API routes live in `app/api/**`. Tenant-aware endpoints (e.g. `app/api/tenants/[tenantSlug]/admin/users/route.ts`) must verify role capabilities before hitting Prisma.
- Client components go in `components/` or `_components/` folders and lean on Shadcn primitives (`components/ui/**`). Use `cn()` from `lib/utils.ts` for class merging.

## Auth & RBAC

- Authentication runs through NextAuth credentials (`app/api/auth/[...nextauth]/route.ts`) with argon2 password verify and PrismaAdapter. Sessions encode memberships via `types/next-auth.d.ts`.
- Always fetch sessions with `requireSession()` from `lib/auth/session.ts`; it throws `UnauthorizedError` to trigger redirects and caches via `getServerSession`.
- Use `ensureTenantMembership()` (`lib/auth/navigation.ts`) to both validate access and redirect to default dashboards when a user lacks a tenant role.
- Role helpers (`lib/auth/rbac.ts`) expose `hasAnyRole`, `assertPermission`, etc. Use them before returning sensitive data or rendering management actions.

## Data Access Patterns

- Prisma client singleton exports from `lib/db.ts`; never instantiate inline. Summaries in `lib/dashboard/*.ts` show the pattern: batch `Promise.all` queries, map to serializable DTOs (convert dates to ISO strings).
- Tenant membership utilities live in `lib/admin/users.ts`; they enforce tenant scoping and normalize presentation data for tables.
- Keep schema changes in `prisma/schema.prisma` aligned with multi-tenant uniqueness constraints (`@@unique([tenantId, ...])`).

## UI Conventions

- Dashboards use `MetricCard` (`app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card.tsx`) and Shadcn table/badge/button kits for summary panes; match the tone when adding new widgets.
- Layouts supply navigation metadata via `DashboardShell` props (`navItems`, `tenant`, `user`); new personas should follow this contract so sidebar state + sign-out actions keep working.
- Theme toggling is handled by `components/theme-provider.tsx` + `ThemeToggle`; ensure new client modules stay wrapped in `ThemeProvider`.

## Workflows & Tooling

- Run locally with `npm run dev`; lint with `npm run lint`. Tailwind v4 is preconfigured in `app/globals.css` using the new `@theme` block.
- After editing `prisma/schema.prisma`, execute `npx prisma migrate dev --name <change>` and update any dependent TypeScript types.
- Use `shadcn add <component>` (config in `components.json`) when introducing new UI primitives to preserve styling and tree-shaking.
- When changing auth flows, ensure related API routes (`app/api/auth/**`) produce consistent JSON shapes because client forms parse `error` fields for messaging.

Ping the maintainer if any requirement here conflicts with live code or is unclear.
