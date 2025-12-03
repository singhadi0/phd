import { DocumentStatus, DocumentType, MeetingStatus } from "@prisma/client";

import prisma from "@/lib/db";

function personName(person?: {
  displayName: string | null;
  firstName: string;
  lastName: string;
}) {
  if (!person) {
    return "—";
  }
  if (person.displayName && person.displayName.trim().length > 0) {
    return person.displayName.trim();
  }
  const fullName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return fullName.length ? fullName : "—";
}

export type ScholarDashboardSummary = {
  profile: {
    id: string;
    enrollmentNumber: string | null;
    researchTitle: string | null;
    specialization: string | null;
    status: string;
    programName: string | null;
    supervisors: Array<{
      id: string;
      role: string;
      name: string;
    }>;
  };
  onboarding: {
    completionPercent: number;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      status: "complete" | "pending";
      href: string | null;
    }>;
  };
  progress: {
    totalMilestones: number;
    completedMilestones: number;
    completionPercent: number;
    nextMilestone: {
      name: string;
      status: string;
      expectedBy: string | null;
    } | null;
  };
  milestones: Array<{
    id: string;
    name: string;
    status: string;
    expectedBy: string | null;
    completedAt: string | null;
    order: number;
  }>;
  coursework: Array<{
    id: string;
    courseCode: string;
    courseTitle: string;
    academicYear: string;
    semester: string;
    status: string;
    grade: string | null;
    credits: number;
  }>;
  documents: Array<{
    id: string;
    title: string | null;
    type: DocumentType;
    status: DocumentStatus;
    updatedAt: string;
  }>;
  finances: {
    outstandingAmount: number;
    currency: string;
    recent: Array<{
      id: string;
      type: string;
      description: string | null;
      amount: number;
      currency: string;
      createdAt: string;
      paidAt: string | null;
    }>;
  };
  meetings: Array<{
    id: string;
    title: string;
    scheduledFor: string;
    status: MeetingStatus;
    organizerName: string;
    location: string | null;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    type: string;
    readAt: string | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    lastObservationAt: string | null;
  }>;
};

export async function getScholarDashboardSummary({
  tenantId,
  membershipId,
}: {
  tenantId: string;
  membershipId: string;
}): Promise<ScholarDashboardSummary> {
  const profile = await prisma.scholarProfile.findFirst({
    where: {
      tenantId,
      membershipId,
    },
    include: {
      program: { select: { name: true } },
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
        orderBy: {
          milestone: {
            order: "asc",
          },
        },
      },
      courseEnrollments: {
        include: {
          course: {
            select: {
              code: true,
              title: true,
              credits: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      },
      researchProjects: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
        include: {
          observations: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!profile) {
    throw new Error("Scholar profile not found for current membership");
  }

  const [
    documents,
    outstandingFeesAggregate,
    recentLedgerEntries,
    meetings,
    notifications,
  ] = await Promise.all([
    prisma.document.findMany({
      where: {
        tenantId,
        scholarId: profile.id,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.feeLedgerEntry.aggregate({
      where: {
        tenantId,
        scholarId: profile.id,
        paidAt: null,
        type: "fee",
      },
      _sum: { amount: true },
    }),
    prisma.feeLedgerEntry.findMany({
      where: {
        tenantId,
        scholarId: profile.id,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.meeting.findMany({
      where: {
        tenantId,
        scheduledFor: { gte: new Date() },
        status: { in: [MeetingStatus.REQUESTED, MeetingStatus.CONFIRMED] },
        participants: {
          some: {
            membershipId,
          },
        },
      },
      orderBy: { scheduledFor: "asc" },
      take: 5,
      include: {
        organizer: {
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
    }),
    prisma.notification.findMany({
      where: {
        tenantId,
        recipientId: membershipId,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const totalMilestones = profile.milestones.length;
  const completedMilestones = profile.milestones.filter((item) =>
    ["completed", "approved", "done"].includes(item.status.toLowerCase())
  ).length;
  const completionPercent = totalMilestones
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const upcomingMilestones = profile.milestones
    .filter(
      (item) =>
        !["completed", "approved", "done"].includes(item.status.toLowerCase())
    )
    .sort((a, b) => {
      const aDate = a.expectedBy ?? new Date(8640000000000000);
      const bDate = b.expectedBy ?? new Date(8640000000000000);
      return aDate.getTime() - bDate.getTime();
    });

  const nextMilestone = upcomingMilestones.length
    ? {
        name: upcomingMilestones[0].milestone?.name ?? "Milestone",
        status: upcomingMilestones[0].status,
        expectedBy: upcomingMilestones[0].expectedBy
          ? upcomingMilestones[0].expectedBy.toISOString()
          : null,
      }
    : null;

  const synopsisDocument = documents.find(
    (item) => item.type === DocumentType.SYNOPSIS
  );

  const onboardingSteps = [
    {
      id: "profile-details",
      title: "Confirm your scholar profile",
      description:
        "Add your research focus and specialization so supervisors see the latest context",
      status:
        profile.researchTitle && profile.specialization
          ? "complete"
          : "pending",
      href: "/scholar",
    },
    {
      id: "submit-synopsis",
      title: "Submit your synopsis draft",
      description:
        "Upload the latest synopsis for supervisor review and comments",
      status:
        synopsisDocument && synopsisDocument.status !== DocumentStatus.DRAFT
          ? "complete"
          : "pending",
      href: "/scholar/documents",
    },
    {
      id: "enrol-coursework",
      title: "Enroll in required coursework",
      description:
        "Track credit-bearing modules and keep your transcript current",
      status: profile.courseEnrollments.length > 0 ? "complete" : "pending",
      href: "/scholar/coursework",
    },
    {
      id: "schedule-meeting",
      title: "Schedule your supervisor check-in",
      description: "Align on milestones and open risks in a dedicated session",
      status: meetings.length > 0 ? "complete" : "pending",
      href: "/scholar/meetings",
    },
  ] as const;

  const onboardingCompletedSteps = onboardingSteps.filter(
    (step) => step.status === "complete"
  ).length;
  const onboardingCompletionPercent = Math.round(
    (onboardingCompletedSteps / onboardingSteps.length) * 100
  );

  return {
    profile: {
      id: profile.id,
      enrollmentNumber: profile.enrollmentNumber,
      researchTitle: profile.researchTitle,
      specialization: profile.specialization,
      status: profile.status,
      programName: profile.program?.name ?? null,
      supervisors: profile.supervisors.map((item) => ({
        id: item.id,
        role: item.role,
        name: personName(item.supervisor.user),
      })),
    },
    onboarding: {
      completionPercent: onboardingCompletionPercent,
      steps: onboardingSteps.map((step) => ({ ...step })),
    },
    progress: {
      totalMilestones,
      completedMilestones,
      completionPercent,
      nextMilestone,
    },
    milestones: profile.milestones.map((item) => ({
      id: item.id,
      name: item.milestone?.name ?? "Milestone",
      status: item.status,
      expectedBy: item.expectedBy ? item.expectedBy.toISOString() : null,
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      order: item.milestone?.order ?? 0,
    })),
    coursework: profile.courseEnrollments.map((item) => ({
      id: item.id,
      courseCode: item.course?.code ?? "—",
      courseTitle: item.course?.title ?? "Course",
      academicYear: item.academicYear,
      semester: item.semester,
      status: item.status,
      grade: item.grade,
      credits: item.course?.credits ?? 0,
    })),
    documents: documents.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      updatedAt: item.updatedAt.toISOString(),
    })),
    finances: {
      outstandingAmount: Number(outstandingFeesAggregate._sum.amount ?? 0),
      currency:
        recentLedgerEntries.find((entry) => entry.currency)?.currency ?? "INR",
      recent: recentLedgerEntries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        description: entry.description,
        amount: Number(entry.amount),
        currency: entry.currency,
        createdAt: entry.createdAt.toISOString(),
        paidAt: entry.paidAt ? entry.paidAt.toISOString() : null,
      })),
    },
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      scheduledFor: meeting.scheduledFor.toISOString(),
      status: meeting.status,
      organizerName: personName(meeting.organizer.user),
      location: meeting.location,
    })),
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString(),
      type: notification.type,
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
    })),
    projects: profile.researchProjects.map((project) => ({
      id: project.id,
      title: project.title,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
      lastObservationAt: project.observations[0]?.recordedAt
        ? project.observations[0]?.recordedAt.toISOString()
        : null,
    })),
  };
}
