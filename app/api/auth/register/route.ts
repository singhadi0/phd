import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { hash } from "argon2";
import { RoleKey } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";

const bodySchema = z.object({
  tenantName: z.string().min(2).max(120),
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

function slugifyTenantName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureUniqueTenantSlug(name: string): Promise<string> {
  const base = slugifyTenantName(name) || `tenant-${randomUUID().slice(0, 8)}`;
  let candidate = base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await prisma.tenant.findUnique({
      where: { slug: candidate },
    });
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${randomUUID().slice(0, 4)}`;
  }

  throw new Error("Unable to generate a unique tenant slug");
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { tenantName, firstName, lastName, email, password } = parsed.data;

    const [tenantSlug, existingUser] = await Promise.all([
      ensureUniqueTenantSlug(tenantName),
      prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    ]);

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
