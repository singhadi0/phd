import argon2 from "argon2";
import { AdmissionPathway, AdmissionStatus } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";

const PENDING_STATUSES: AdmissionStatus[] = [
  AdmissionStatus.APPLIED,
  AdmissionStatus.VERIFIED,
  AdmissionStatus.INTERVIEW_SCHEDULED,
  AdmissionStatus.FEE_PENDING,
  AdmissionStatus.WAITLISTED,
];

export type AdminAdmissionSummary = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  status: AdmissionStatus;
  pathway: string;
  programName: string;
  updatedAt: string;
  createdAt: string;
};

export type AdminAdmissionList = {
  stats: {
    total: number;
    pending: number;
    enrolled: number;
    rejected: number;
  };
  items: AdminAdmissionSummary[];
};

export async function listAdmissions(
  tenantId: string
): Promise<AdminAdmissionList> {
  const [admissions, total, pending, enrolled, rejected] = await Promise.all([
    prisma.admission.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        program: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
      },
    }),
    prisma.admission.count({ where: { tenantId } }),
    prisma.admission.count({
      where: { tenantId, status: { in: PENDING_STATUSES } },
    }),
    prisma.admission.count({
      where: { tenantId, status: AdmissionStatus.ENROLLED },
    }),
    prisma.admission.count({
      where: { tenantId, status: AdmissionStatus.REJECTED },
    }),
  ]);

  const items = admissions.map((admission) => {
    const displayName =
      admission.user.displayName?.trim() ??
      `${admission.user.firstName} ${admission.user.lastName}`.trim();

    return {
      id: admission.id,
      applicantName: displayName.length ? displayName : admission.user.email,
      applicantEmail: admission.user.email,
      status: admission.status,
      pathway: admission.pathway,
      programName: admission.program.name,
      updatedAt: admission.updatedAt.toISOString(),
      createdAt: admission.createdAt.toISOString(),
    } satisfies AdminAdmissionSummary;
  });

  return {
    stats: {
      total,
      pending,
      enrolled,
      rejected,
    },
    items,
  } satisfies AdminAdmissionList;
}

const createAdmissionInputSchema = z.object({
  tenantId: z.string(),
  programId: z.string(),
  pathway: z.nativeEnum(AdmissionPathway),
  status: z.nativeEnum(AdmissionStatus).optional(),
  applicant: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
  }),
  notes: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateAdmissionInput = z.infer<typeof createAdmissionInputSchema>;

export async function createAdmission(
  rawInput: CreateAdmissionInput
): Promise<AdminAdmissionSummary> {
  const input = createAdmissionInputSchema.parse(rawInput);

  const program = await prisma.program.findUnique({
    where: { id: input.programId },
    select: { tenantId: true, name: true },
  });

  if (!program || program.tenantId !== input.tenantId) {
    throw new Error("Program not found for tenant");
  }

  let user = await prisma.user.findUnique({
    where: { email: input.applicant.email },
  });

  if (!user) {
    const passwordSeed = input.applicant.email;
    const hashedPassword = await argon2.hash(passwordSeed);

    user = await prisma.user.create({
      data: {
        email: input.applicant.email,
        firstName: input.applicant.firstName,
        lastName: input.applicant.lastName,
        displayName:
          `${input.applicant.firstName} ${input.applicant.lastName}`.trim(),
        hashedPassword,
      },
    });
  }

  const admission = await prisma.admission.create({
    data: {
      tenantId: input.tenantId,
      programId: input.programId,
      userId: user.id,
      status: input.status ?? AdmissionStatus.APPLIED,
      pathway: input.pathway,
      applicationData: {
        notes: input.notes ?? null,
        source: input.source ?? null,
        metadata: input.metadata ?? null,
      },
    },
    include: {
      program: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const displayName =
    admission.user.displayName?.trim() ??
    `${admission.user.firstName} ${admission.user.lastName}`.trim();

  return {
    id: admission.id,
    applicantName: displayName.length ? displayName : admission.user.email,
    applicantEmail: admission.user.email,
    status: admission.status,
    pathway: admission.pathway,
    programName: admission.program.name,
    updatedAt: admission.updatedAt.toISOString(),
    createdAt: admission.createdAt.toISOString(),
  } satisfies AdminAdmissionSummary;
}
