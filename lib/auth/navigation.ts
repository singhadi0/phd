import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { RoleKey } from "@prisma/client";

import type { SessionMembership } from "@/types/next-auth";
import { ForbiddenError, requireMembership } from "@/lib/auth/session";

function resolveDashboardSegment(roleKey: RoleKey): string | null {
  switch (roleKey) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "admin";
    case "SUPERVISOR":
      return "supervisor";
    case "SCHOLAR":
      return "scholar";
    case "DEVELOPER":
      return "developer";
    default:
      return null;
  }
}

export function resolveDashboardHref(membership: SessionMembership): string {
  const segment = resolveDashboardSegment(membership.roleKey);
  if (!segment) {
    return `/${membership.tenantSlug}`;
  }
  return `/${membership.tenantSlug}/${segment}`;
}

export function resolvePrimaryMembership(
  session: Session
): SessionMembership | null {
  if (!session.user.memberships.length) {
    return null;
  }

  const activeTenantId = session.user.activeTenantId;
  if (activeTenantId) {
    const activeMembership = session.user.memberships.find(
      (item) => item.tenantId === activeTenantId
    );
    if (activeMembership) {
      return activeMembership;
    }
  }

  const primaryMembership = session.user.memberships.find(
    (item) => item.primary
  );
  if (primaryMembership) {
    return primaryMembership;
  }

  return session.user.memberships[0] ?? null;
}

export function resolveDefaultDashboardPath(session: Session): string {
  const membership = resolvePrimaryMembership(session);
  if (!membership) {
    return "/";
  }

  return resolveDashboardHref(membership);
}

export function ensureTenantMembership(
  session: Session,
  criteria: {
    tenantSlug?: string;
    tenantId?: string;
    fallback?: string;
    roleKey?: RoleKey | RoleKey[];
  }
): SessionMembership {
  try {
    return requireMembership(session, criteria);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const resolvedFallback =
        criteria.fallback ?? resolveDefaultDashboardPath(session);
      const target =
        criteria.tenantSlug && resolvedFallback === `/${criteria.tenantSlug}`
          ? "/"
          : resolvedFallback;
      redirect(target);
    }
    throw error;
  }
}
