import { cache } from "react";

import type { RoleKey } from "@prisma/client";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import type { SessionMembership } from "@/types/next-auth";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const getCurrentSession = cache(async () =>
  getServerSession(authOptions)
);

export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

function normalizeRoleKeys(
  roleKey?: RoleKey | RoleKey[]
): RoleKey[] | undefined {
  if (!roleKey) {
    return undefined;
  }
  return Array.isArray(roleKey) ? roleKey : [roleKey];
}

function matchesRole(
  membership: SessionMembership,
  roleKeys?: RoleKey[]
): boolean {
  if (!roleKeys?.length) {
    return true;
  }
  return roleKeys.includes(membership.roleKey);
}

export function findMembershipByTenantId(
  session: Session,
  tenantId: string,
  roleKeys?: RoleKey[]
): SessionMembership | undefined {
  const scoped = session.user.memberships.filter(
    (membership) => membership.tenantId === tenantId
  );

  if (!scoped.length) {
    return undefined;
  }

  return (
    scoped.find((membership) => matchesRole(membership, roleKeys)) ?? scoped[0]
  );
}

export function findMembershipByTenantSlug(
  session: Session,
  tenantSlug: string,
  roleKeys?: RoleKey[]
): SessionMembership | undefined {
  const scoped = session.user.memberships.filter(
    (membership) => membership.tenantSlug === tenantSlug
  );

  if (!scoped.length) {
    return undefined;
  }

  return (
    scoped.find((membership) => matchesRole(membership, roleKeys)) ?? scoped[0]
  );
}

export function requireMembership(
  session: Session,
  criteria: {
    tenantId?: string;
    tenantSlug?: string;
    roleKey?: RoleKey | RoleKey[];
  }
): SessionMembership {
  const roleKeys = normalizeRoleKeys(criteria.roleKey);

  let membership: SessionMembership | undefined;
  if (criteria.tenantId) {
    membership = findMembershipByTenantId(session, criteria.tenantId, roleKeys);
  } else if (criteria.tenantSlug) {
    membership = findMembershipByTenantSlug(
      session,
      criteria.tenantSlug,
      roleKeys
    );
  }

  if (!membership) {
    throw new ForbiddenError("Missing required tenant membership");
  }

  if (roleKeys?.length && !matchesRole(membership, roleKeys)) {
    throw new ForbiddenError("Missing required role membership");
  }

  return membership;
}
