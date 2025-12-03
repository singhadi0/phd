import prisma from "@/lib/db";

export type AdminProgramSummary = {
  id: string;
  name: string;
  code: string | null;
  departmentName: string | null;
  durationMonths: number;
  courseCount: number;
  milestoneCount: number;
  courses: Array<{
    id: string;
    code: string;
    title: string;
    credits: number;
  }>;
  updatedAt: string;
};

export type AdminProgramList = {
  stats: {
    totalPrograms: number;
    totalCourses: number;
    totalMilestones: number;
  };
  items: AdminProgramSummary[];
};

export async function listPrograms(
  tenantId: string
): Promise<AdminProgramList> {
  const programs = await prisma.program.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      department: {
        select: {
          name: true,
        },
      },
      courses: {
        select: { id: true, code: true, title: true, credits: true },
        orderBy: { title: "asc" },
      },
      milestones: {
        select: { id: true },
      },
    },
  });

  const items = programs.map(
    (program) =>
      ({
        id: program.id,
        name: program.name,
        code: program.code,
        departmentName: program.department?.name ?? null,
        durationMonths: program.durationMonths,
        courseCount: program.courses.length,
        milestoneCount: program.milestones.length,
        courses: program.courses.map((course) => ({
          id: course.id,
          code: course.code,
          title: course.title,
          credits: course.credits,
        })),
        updatedAt: program.updatedAt.toISOString(),
      } satisfies AdminProgramSummary)
  );

  const totals = items.reduce(
    (acc, program) => {
      acc.totalCourses += program.courseCount;
      acc.totalMilestones += program.milestoneCount;
      return acc;
    },
    { totalCourses: 0, totalMilestones: 0 }
  );

  return {
    stats: {
      totalPrograms: items.length,
      totalCourses: totals.totalCourses,
      totalMilestones: totals.totalMilestones,
    },
    items,
  } satisfies AdminProgramList;
}

export type CreateProgramInput = {
  tenantId: string;
  name: string;
  code?: string | null;
  durationMonths: number;
  courseworkRequired?: boolean;
  departmentId?: string | null;
};

export async function createProgram(input: CreateProgramInput) {
  const duration = Number(input.durationMonths);
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("Program duration must be a positive integer");
  }

  return prisma.program.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      code: input.code ?? null,
      durationMonths: duration,
      courseworkRequired: input.courseworkRequired ?? true,
      departmentId: input.departmentId ?? undefined,
    },
  });
}

export type CreateCourseInput = {
  tenantId: string;
  programId: string;
  code: string;
  title: string;
  credits: number;
};

export async function createCourse(input: CreateCourseInput) {
  const program = await prisma.program.findUnique({
    where: { id: input.programId },
    select: { tenantId: true },
  });

  if (!program || program.tenantId !== input.tenantId) {
    throw new Error("Program not found for tenant");
  }

  const credits = Number(input.credits);
  if (Number.isNaN(credits) || credits <= 0) {
    throw new Error("Course credits must be greater than zero");
  }

  return prisma.course.create({
    data: {
      programId: input.programId,
      code: input.code,
      title: input.title,
      credits,
    },
  });
}
