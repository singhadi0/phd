import prisma from "@/lib/db";

export type TenantSettings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  updatedAt: string;
};

export async function getTenantSettings(params: {
  tenantId: string;
}): Promise<TenantSettings> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      contactEmail: true,
      contactPhone: true,
      updatedAt: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    description: tenant.description ?? null,
    contactEmail: tenant.contactEmail ?? null,
    contactPhone: tenant.contactPhone ?? null,
    updatedAt: tenant.updatedAt.toISOString(),
  } satisfies TenantSettings;
}

export async function updateTenantSettings(params: {
  tenantId: string;
  data: {
    name: string;
    description?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  };
}): Promise<TenantSettings> {
  const name = params.data.name.trim();
  if (!name) {
    throw new Error("Tenant name is required");
  }

  const description = params.data.description?.trim() ?? null;
  const contactEmail = params.data.contactEmail?.trim() ?? null;
  const contactPhone = params.data.contactPhone?.trim() ?? null;

  const tenant = await prisma.tenant.update({
    where: { id: params.tenantId },
    data: {
      name,
      description: description && description.length ? description : null,
      contactEmail: contactEmail && contactEmail.length ? contactEmail : null,
      contactPhone: contactPhone && contactPhone.length ? contactPhone : null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      contactEmail: true,
      contactPhone: true,
      updatedAt: true,
    },
  });

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    description: tenant.description ?? null,
    contactEmail: tenant.contactEmail ?? null,
    contactPhone: tenant.contactPhone ?? null,
    updatedAt: tenant.updatedAt.toISOString(),
  } satisfies TenantSettings;
}
