import type { SessionMembership } from "@/types/next-auth";

export type RoleKey =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPERVISOR"
  | "SCHOLAR"
  | "DEVELOPER";

export const MANAGEMENT_ROLES: RoleKey[] = ["SUPER_ADMIN", "ADMIN"];

export function hasRole(membership: SessionMembership, role: RoleKey): boolean {
  return membership.roleKey === role;
}

export function hasAnyRole(
  membership: SessionMembership,
  roles: RoleKey[]
): boolean {
  return roles.some((role) => hasRole(membership, role));
}

export function hasPermission(
  membership: SessionMembership,
  permission: string
): boolean {
  return membership.permissions.includes(permission);
}

export function hasEveryPermission(
  membership: SessionMembership,
  permissions: string[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(membership, permission)
  );
}

export function assertPermission(
  membership: SessionMembership,
  permission: string
): void {
  if (!hasPermission(membership, permission)) {
    throw new Error(`Missing required permission: ${permission}`);
  }
}

export function assertEveryPermission(
  membership: SessionMembership,
  permissions: string[]
): void {
  permissions.forEach((permission) => assertPermission(membership, permission));
}
