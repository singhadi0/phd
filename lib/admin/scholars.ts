import argon2 from "argon2";
import { Prisma, RoleKey } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";
import { sendScholarInvitationEmail } from "@/lib/email/scholar-invite";

export type AdminScholarSummary = {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string | null;
  status: string;
  programName: string | null;
  specialization: string | null;
  supervisorNames: string[];
  milestoneProgress: {
    completed: number;
    total: number;
  };
  nextMilestone?: {
    name: string;
    expectedBy: string | null;
  };
  outstandingFees?: {
    amount: number;
    currency: string;
  };
};

export type AdminScholarList = {
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  items: AdminScholarSummary[];
};

function toDisplayName(person: {
  displayName: string | null;
  firstName: string;
  lastName: string;
}): string {
  const preferred = person.displayName?.trim();
  if (preferred) {
    return preferred;
  }
  const fallback = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return fallback.length ? fallback : "-";
}

const COMPLETED_STATUSES = new Set(["completed", "approved", "done"]);

const scholarProfileInclude = {
  user: {
    select: {
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
    },
  },
  program: {
    select: {
      name: true,
    },
  },
  supervisors: {
    include: {
      supervisor: {
        include: {
          user: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
  milestones: {
    include: {
      milestone: {
        select: {
          name: true,
          order: true,
        },
      },
    },
  },
} satisfies Prisma.ScholarProfileInclude;

type ScholarProfileWithRelations = Prisma.ScholarProfileGetPayload<{
  include: typeof scholarProfileInclude;
}>;

function mapScholarProfileToSummary(
  profile: ScholarProfileWithRelations,
  outstanding?: { amount: number; currency: string }
): AdminScholarSummary {
  const supervisorNames = profile.supervisors
    .filter((assignment) => !assignment.releasedAt)
    .map((assignment) => toDisplayName(assignment.supervisor.user));

  const milestones = profile.milestones;
  const totalMilestones = milestones.length;
  const completed = milestones.filter((milestone) =>
    COMPLETED_STATUSES.has(milestone.status.toLowerCase())
  ).length;

  const upcoming = milestones
    .filter(
      (milestone) => !COMPLETED_STATUSES.has(milestone.status.toLowerCase())
    )
    .sort((a, b) => {
      const aTime = a.expectedBy
        ? a.expectedBy.getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.expectedBy
        ? b.expectedBy.getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  const nextMilestone = upcoming.length
    ? {
        name: upcoming[0].milestone?.name ?? "Milestone",
        expectedBy: upcoming[0].expectedBy
          ? upcoming[0].expectedBy.toISOString()
          : null,
      }
    : undefined;

  return {
    id: profile.id,
    name: toDisplayName(profile.user),
    email: profile.user.email,
    enrollmentNumber: profile.enrollmentNumber,
    status: profile.status,
    programName: profile.program?.name ?? null,
    specialization: profile.specialization,
    supervisorNames,
    milestoneProgress: {
      completed,
      total: totalMilestones,
    },
    nextMilestone,
    outstandingFees: outstanding,
  } satisfies AdminScholarSummary;
}

export async function listScholars(
  tenantId: string
): Promise<AdminScholarList> {
  const [profiles, outstandingFeeGroups] = await Promise.all([
    prisma.scholarProfile.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      include: scholarProfileInclude,
    }),
    prisma.feeLedgerEntry.groupBy({
      by: ["scholarId", "currency"],
      where: {
        tenantId,
        paidAt: null,
        type: "fee",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const feeMap = new Map<string, { amount: number; currency: string }>();
  outstandingFeeGroups.forEach((group) => {
    const amount = Number(group._sum.amount ?? 0);
    if (!amount) {
      return;
    }
    const existing = feeMap.get(group.scholarId);
    if (existing) {
      existing.amount += amount;
    } else {
      feeMap.set(group.scholarId, {
        amount,
        currency: group.currency,
      });
    }
  });

  const items = profiles.map((profile) =>
    mapScholarProfileToSummary(profile, feeMap.get(profile.id))
  );

  const stats = items.reduce(
    (acc, scholar) => {
      acc.total += 1;
      if (scholar.status.toLowerCase() === "active") {
        acc.active += 1;
      } else {
        acc.inactive += 1;
      }
      return acc;
    },
    { total: 0, active: 0, inactive: 0 }
  );

  return {
    stats,
    items,
  } satisfies AdminScholarList;
}

const inviteScholarSchema = z.object({
  tenantId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

export type InviteScholarInput = z.infer<typeof inviteScholarSchema>;

export async function inviteScholar(rawInput: InviteScholarInput) {
  const input = inviteScholarSchema.parse(rawInput);

  const { temporaryPassword, userEmail, firstName } = await prisma.$transaction(
    async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error("A user with this email already exists.");
      }

      const role = await tx.role.findFirst({
        where: {
          tenantId: input.tenantId,
          key: RoleKey.SCHOLAR,
        },
      });

      if (!role) {
        throw new Error("Scholar role is not configured for this tenant");
      }

      const passwordSeed = input.email;
      const hashedPassword = await argon2.hash(passwordSeed);

      const user = await tx.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: `${input.firstName} ${input.lastName}`.trim(),
          hashedPassword,
          defaultTenantId: input.tenantId,
          activeTenantId: input.tenantId,
        },
      });

      await tx.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: input.tenantId,
          roleId: role.id,
          status: "invited",
          title: "PhD Scholar",
          permissions: role.permissions,
        },
      });

      return {
        temporaryPassword: passwordSeed,
        userEmail: user.email,
        firstName: user.firstName,
      };
    }
  );

  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { name: true },
  });

  await sendScholarInvitationEmail({
    recipientEmail: userEmail,
    firstName,
    tenantName: tenant?.name ?? "Research X",
    temporaryPassword,
  });

  return { email: userEmail };
}

const optionalDate = z
  .union([z.string().min(1), z.date()])
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid date");
    }
    return parsed;
  });

const createFeeEntrySchema = z.object({
  tenantId: z.string(),
  scholarId: z.string(),
  type: z.enum(["fee", "payment", "adjustment"]),
  amount: z.coerce.number().positive(),
  currency: z.string().default("INR"),
  dueDate: optionalDate,
  paidAt: optionalDate,
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
});

export type CreateFeeEntryInput = z.infer<typeof createFeeEntrySchema>;

export async function createFeeEntry(rawInput: CreateFeeEntryInput) {
  const input = createFeeEntrySchema.parse(rawInput);

  const scholar = await prisma.scholarProfile.findUnique({
    where: { id: input.scholarId },
    select: { tenantId: true },
  });

  if (!scholar || scholar.tenantId !== input.tenantId) {
    throw new Error("Scholar not found for tenant");
  }

  return prisma.feeLedgerEntry.create({
    data: {
      tenantId: input.tenantId,
      scholarId: input.scholarId,
      type: input.type,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency,
      dueDate: input.dueDate,
      paidAt: input.paidAt,
      description: input.description,
      referenceNumber: input.referenceNumber,
    },
  });
}

const createEnrollmentSchema = z.object({
  tenantId: z.string(),
  scholarId: z.string(),
  courseId: z.string(),
  academicYear: z.string().min(4),
  semester: z.string().min(1),
  status: z.string().default("in_progress"),
  grade: z.string().optional(),
});

export type CreateScholarEnrollmentInput = z.infer<
  typeof createEnrollmentSchema
>;

export async function createScholarEnrollment(
  rawInput: CreateScholarEnrollmentInput
) {
  const input = createEnrollmentSchema.parse(rawInput);

  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    select: {
      program: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!course || course.program.tenantId !== input.tenantId) {
    throw new Error("Course not found for tenant");
  }

  const scholar = await prisma.scholarProfile.findUnique({
    where: { id: input.scholarId },
    select: { tenantId: true },
  });

  if (!scholar || scholar.tenantId !== input.tenantId) {
    throw new Error("Scholar not found for tenant");
  }

  return prisma.scholarCourseEnrollment.create({
    data: {
      scholarId: input.scholarId,
      courseId: input.courseId,
      academicYear: input.academicYear,
      semester: input.semester,
      status: input.status,
      grade: input.grade,
    },
  });
}
