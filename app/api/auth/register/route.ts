import { NextResponse } from "next/server";
import { hash } from "argon2";
import { RoleKey } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";

const bodySchema = z.object({
  tenantName: z.string().min(2).max(120),
  tenantSlug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphen"),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const ROLE_SEED: Array<{
  key: RoleKey;
  name: string;
  description: string;
  permissions: string[];
}> = [
  {
    key: RoleKey.SUPER_ADMIN,
    name: "Super Admin",
    description: "Full control over the tenant",
    permissions: ["*"],
  },
  {
    key: RoleKey.ADMIN,
    name: "Admin",
    description: "Manage admissions, finances, and communications",
    permissions: [
      "admissions:manage",
      "finance:manage",
      "communications:manage",
    ],
  },
  {
    key: RoleKey.SUPERVISOR,
    name: "Supervisor",
    description: "Monitor scholars and submit reports",
    permissions: ["scholar:read", "scholar:update", "meeting:manage"],
  },
  {
    key: RoleKey.SCHOLAR,
    name: "Scholar",
    description: "Engage with program requirements",
    permissions: ["self:read", "self:update"],
  },
  {
    key: RoleKey.DEVELOPER,
    name: "Developer",
    description: "Build tenant integrations",
    permissions: ["api:access", "webhook:manage"],
  },
];

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { tenantName, tenantSlug, firstName, lastName, email, password } =
      parsed.data;

    const [existingTenant, existingUser] = await Promise.all([
      prisma.tenant.findUnique({ where: { slug: tenantSlug } }),
      prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    ]);

    if (existingTenant) {
      return NextResponse.json(
        { error: "Tenant slug is already in use." },
        { status: 409 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
        },
      });

      const roles = await Promise.all(
        ROLE_SEED.map((role) =>
          tx.role.create({
            data: {
              tenantId: tenant.id,
              key: role.key,
              name: role.name,
              description: role.description,
              permissions: role.permissions,
            },
          })
        )
      );

      const superAdminRole = roles.find(
        (role) => role.key === RoleKey.SUPER_ADMIN
      );
      if (!superAdminRole) {
        throw new Error("Failed to seed default roles");
      }

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          hashedPassword,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
          defaultTenantId: tenant.id,
          activeTenantId: tenant.id,
        },
      });

      await tx.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          roleId: superAdminRole.id,
          status: "active",
          primary: true,
          permissions: superAdminRole.permissions,
        },
      });

      return { tenantId: tenant.id };
    });

    return NextResponse.json({ tenantId: result.tenantId }, { status: 201 });
  } catch (error) {
    console.error("Registration error", error);
    return NextResponse.json(
      { error: "Unexpected error while creating tenant." },
      { status: 500 }
    );
  }
}
