import { PrismaAdapter } from "@auth/prisma-adapter";
import { verify } from "argon2";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import prisma from "@/lib/db";
import type { SessionMembership } from "@/types/next-auth";

type RoleKey = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "SCHOLAR" | "DEVELOPER";

const credentialsSchema = z.object({
  email: z.string().email({ message: "Enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
  tenant: z.string().min(1, { message: "Tenant slug is required" }).optional(),
});

export type AuthorizeUser = {
  id: string;
  email: string;
  name?: string | null;
  defaultTenantId?: string | null;
  memberships: SessionMembership[];
  activeTenantId?: string | null;
};

function mapMemberships(
  memberships: Array<{
    id: string;
    status: string;
    primary: boolean;
    permissions: string[];
    tenant: { id: string; slug: string; name: string };
    role: { id: string; key: RoleKey; name: string };
  }>
): SessionMembership[] {
  return memberships.map((membership) => ({
    membershipId: membership.id,
    tenantId: membership.tenant.id,
    tenantSlug: membership.tenant.slug,
    tenantName: membership.tenant.name,
    roleId: membership.role.id,
    roleKey: membership.role.key,
    roleName: membership.role.name,
    permissions: membership.permissions ?? [],
    status: membership.status,
    primary: membership.primary,
  }));
}

function resolveActiveTenant(
  memberships: SessionMembership[],
  requestedSlug?: string,
  defaultTenantId?: string | null,
  currentActiveTenantId?: string | null
): string | null {
  if (!memberships.length) {
    return null;
  }

  if (currentActiveTenantId) {
    const match = memberships.find(
      (item) => item.tenantId === currentActiveTenantId
    );
    if (match) {
      return match.tenantId;
    }
  }

  if (requestedSlug) {
    const match = memberships.find((item) => item.tenantSlug === requestedSlug);
    if (match) {
      return match.tenantId;
    }
  }

  if (defaultTenantId) {
    const match = memberships.find((item) => item.tenantId === defaultTenantId);
    if (match) {
      return match.tenantId;
    }
  }

  const primaryMembership = memberships.find((item) => item.primary);
  if (primaryMembership) {
    return primaryMembership.tenantId;
  }

  return memberships[0].tenantId;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenant: { label: "Tenant", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials ?? {});
        if (!parsed.success) {
          return null;
        }

        const { email, password, tenant } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            memberships: {
              where: { status: "active" },
              include: {
                tenant: { select: { id: true, slug: true, name: true } },
                role: { select: { id: true, key: true, name: true } },
              },
            },
          },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const passwordMatches = await verify(user.hashedPassword, password);
        if (!passwordMatches) {
          return null;
        }

        const memberships = mapMemberships(user.memberships);

        if (!memberships.length) {
          throw new Error("Account is not linked to any active tenants");
        }

        const activeTenantId = resolveActiveTenant(
          memberships,
          tenant,
          user.defaultTenantId,
          user.activeTenantId ?? null
        );

        const existingActiveTenantId = user.activeTenantId ?? null;

        if (activeTenantId !== existingActiveTenantId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { activeTenantId: activeTenantId ?? null },
          });
        }

        if (!activeTenantId) {
          throw new Error("Requested tenant access is not available");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? `${user.firstName} ${user.lastName}`.trim(),
          defaultTenantId: user.defaultTenantId,
          memberships,
          activeTenantId,
        } satisfies AuthorizeUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as AuthorizeUser;
        token.sub = authUser.id;
        token.email = authUser.email;
        token.defaultTenantId = authUser.defaultTenantId ?? null;
        token.activeTenantId =
          authUser.activeTenantId ??
          authUser.defaultTenantId ??
          authUser.memberships[0]?.tenantId ??
          null;
        token.memberships = authUser.memberships;
      }
      if (!user && token.sub && (!token.memberships || !token.activeTenantId)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            memberships: {
              where: { status: "active" },
              include: {
                tenant: { select: { id: true, slug: true, name: true } },
                role: { select: { id: true, key: true, name: true } },
              },
            },
          },
        });

        if (dbUser) {
          const memberships = mapMemberships(dbUser.memberships);
          token.memberships = memberships;
          token.defaultTenantId = dbUser.defaultTenantId ?? null;
          token.activeTenantId = resolveActiveTenant(
            memberships,
            undefined,
            dbUser.defaultTenantId,
            dbUser.activeTenantId ?? null
          );
        }
      }

      if (trigger === "update" && session?.activeTenantId) {
        token.activeTenantId = session.activeTenantId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      session.user.email = token.email ?? session.user.email;
      session.user.defaultTenantId =
        (token.defaultTenantId as string | null | undefined) ?? null;
      session.user.activeTenantId =
        (token.activeTenantId as string | null | undefined) ?? null;
      session.user.memberships =
        (token.memberships as SessionMembership[] | undefined) ?? [];
      return session;
    },
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }
      await prisma.user
        .update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
        .catch(() => undefined);
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      const authUser = user as AuthorizeUser;
      const tenantId =
        authUser.activeTenantId ??
        authUser.defaultTenantId ??
        authUser.memberships[0]?.tenantId;

      if (!tenantId) {
        return;
      }

      await prisma.auditLog
        .create({
          data: {
            tenantId,
            userId: authUser.id,
            action: "AUTH_SIGN_IN",
            context: { email: authUser.email },
          },
        })
        .catch(() => undefined);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;
