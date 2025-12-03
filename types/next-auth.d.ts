import { RoleKey } from "@prisma/client";

export type SessionMembership = {
  membershipId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleId: string;
  roleKey: RoleKey;
  roleName: string;
  permissions: string[];
  status: string;
  primary: boolean;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      defaultTenantId?: string | null;
      activeTenantId?: string | null;
      memberships: SessionMembership[];
    };
  }

  interface User {
    id: string;
    email: string;
    defaultTenantId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    email?: string;
    defaultTenantId?: string | null;
    activeTenantId?: string | null;
    memberships?: SessionMembership[];
  }
}

export {};
