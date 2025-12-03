import { z } from "zod";

import prisma from "@/lib/db";

const membershipStatusSchema = z.enum(["active", "suspended"]);

export type TenantMemberSummary = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: string;
  title: string | null;
  primary: boolean;
  joinedAt: string;
  lastUpdatedAt: string;
  permissions: string[];
};

export async function listTenantMembers(tenantId: string): Promise<TenantMemberSummary[]> {
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
        },
      },
      role: {
        select: {
          id: true,
          key: true,
          name: true,
        },
      },
    },
  });

  return memberships.map((membership) => {
    const displayName =
      membership.user.displayName?.trim() ??
      `${membership.user.firstName} ${membership.user.lastName}`.trim();

    return {
      membershipId: membership.id,
      userId: membership.userId,
      name: displayName.length ? displayName : membership.user.email,
      email: membership.user.email,
      roleId: membership.roleId,
      roleKey: membership.role.key,
      roleName: membership.role.name,
      status: membership.status,
      title: membership.title,
      primary: membership.primary,
      permissions: membership.permissions,
      joinedAt: membership.createdAt.toISOString(),
      lastUpdatedAt: membership.updatedAt.toISOString(),
    };
  });
}

export async function updateTenantMembershipStatus(params: {
  tenantId: string;
  membershipId: string;
  status: string;
  actingMembershipId: string;
}) {
  const payload = membershipStatusSchema.safeParse(params.status.toLowerCase());
  if (!payload.success) {
    throw new Error("Invalid membership status");
  }

  if (params.membershipId === params.actingMembershipId) {
    throw new Error("You cannot update your own membership status");
  }

  const existingMembership = await prisma.tenantMembership.findUnique({
    where: { id: params.membershipId },
    select: { tenantId: true },
  });

  if (!existingMembership || existingMembership.tenantId !== params.tenantId) {
    throw new Error("Membership not found for tenant");
  }

  const updatedMembership = await prisma.tenantMembership.update({
    where: { id: params.membershipId },
    data: {
      status: payload.data,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
        },
      },
      role: {
        select: {
          id: true,
          key: true,
          name: true,
        },
      },
    },
  });

  const displayName =
    updatedMembership.user.displayName?.trim() ??
    `${updatedMembership.user.firstName} ${updatedMembership.user.lastName}`.trim();

  return {
    membershipId: updatedMembership.id,
    userId: updatedMembership.userId,
    name: displayName.length ? displayName : updatedMembership.user.email,
    email: updatedMembership.user.email,
    roleId: updatedMembership.roleId,
    roleKey: updatedMembership.role.key,
    roleName: updatedMembership.role.name,
    status: updatedMembership.status,
    title: updatedMembership.title,
    primary: updatedMembership.primary,
    permissions: updatedMembership.permissions,
    joinedAt: updatedMembership.createdAt.toISOString(),
    lastUpdatedAt: updatedMembership.updatedAt.toISOString(),
  } as TenantMemberSummary;
}
