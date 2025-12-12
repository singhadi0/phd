import { Prisma } from "@prisma/client";

import prisma from "@/lib/db";

export type AdminDepartmentSummary = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  programCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function listDepartments(
  tenantId: string
): Promise<AdminDepartmentSummary[]> {
  const departments = await prisma.department.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { programs: true },
      },
    },
  });

  return departments.map((department) => ({
    id: department.id,
    name: department.name,
    code: department.code ?? null,
    description: department.description ?? null,
    programCount: department._count.programs,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  }));
}

export type CreateDepartmentInput = {
  tenantId: string;
  name: string;
  code?: string | null;
  description?: string | null;
};

export async function createDepartment(input: CreateDepartmentInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Department name is required");
  }

  const code = input.code?.trim();
  const description = input.description?.trim();

  const existingDepartment = await prisma.department.findFirst({
    where: {
      tenantId: input.tenantId,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existingDepartment) {
    throw new Error(
      "A department with this name already exists for the tenant."
    );
  }

  try {
    return await prisma.department.create({
      data: {
        tenantId: input.tenantId,
        name,
        code: code && code.length ? code : null,
        description: description && description.length ? description : null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(
        "A department with this name already exists for the tenant."
      );
    }
    throw error;
  }
}
