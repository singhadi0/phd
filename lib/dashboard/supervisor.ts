import { DocumentStatus, DocumentType, MeetingStatus } from "@prisma/client";

import prisma from "@/lib/db";

function personName(person?: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
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

export type SupervisorDashboardSummary = {
  profile: {
    id: string;
    name: string;
    email: string | null;
    designation: string | null;
    department: string | null;
    workloadTarget: number | null;
    activeScholarCount: number;
  };
  metrics: {
    activeScholars: number;
    documentsAwaitingReview: number;
    upcomingMeetings: number;
    activeThreads: number;
  };
  scholars: Array<{
    id: string;
    name: string;
    programName: string | null;
    status: string;
    researchTitle: string | null;
    specialization: string | null;
    completionPercent: number;
    nextMilestoneName: string | null;
    nextMilestoneDue: string | null;
    assignedAt: string;
  }>;
  documents: Array<{
    id: string;
    title: string | null;
    type: DocumentType;
    status: DocumentStatus;
    updatedAt: string;
    scholarName: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    scheduledFor: string;
    status: MeetingStatus;
    location: string | null;
    organizerName: string;
  }>;
  threads: Array<{
    id: string;
    subject: string;
    updatedAt: string;
    lastMessageSnippet: string | null;
    lastAuthorName: string | null;
  }>;
};

export async function getSupervisorDashboardSummary({
  tenantId,
  membershipId,
}: {
  tenantId: string;
  membershipId: string;
}): Promise<SupervisorDashboardSummary> {
  const supervisor = await prisma.supervisorProfile.findFirst({
    where: { tenantId, membershipId },
    include: {
      user: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      department: {
        select: { name: true },
      },
      scholars: {
        where: { releasedAt: null },
        select: {
          id: true,
          assignedAt: true,
          scholar: {
            select: {
              id: true,
              status: true,
              researchTitle: true,
              specialization: true,
              user: {
                select: {
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
              milestones: {
                select: {
                  id: true,
                  status: true,
                  expectedBy: true,
                  completedAt: true,
                  milestone: {
                    select: {
                      name: true,
                      order: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!supervisor) {
    throw new Error("Supervisor profile not found for current membership");
  }

  const scholarAssignments = supervisor.scholars;
  const scholarIds = scholarAssignments.map(
    (assignment) => assignment.scholar.id
  );

  const [documents, meetings, threads] = await Promise.all([
    scholarIds.length
      ? prisma.document.findMany({
          where: {
            tenantId,
            scholarId: { in: scholarIds },
            status: {
              in: [DocumentStatus.SUBMITTED, DocumentStatus.UNDER_REVIEW],
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 6,
          include: {
            scholar: {
              select: {
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
        })
      : [],
    prisma.meeting.findMany({
      where: {
        tenantId,
        scheduledFor: { gte: new Date() },
        status: { in: [MeetingStatus.REQUESTED, MeetingStatus.CONFIRMED] },
        OR: [
          { organizerId: membershipId },
          {
            participants: {
              some: { membershipId },
            },
          },
        ],
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
    prisma.messageThread.findMany({
      where: {
        tenantId,
        participants: {
          some: { membershipId },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
          include: {
            author: {
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
  ]);

  const scholars = scholarAssignments.map((assignment) => {
    const { scholar, assignedAt } = assignment;
    const totalMilestones = scholar.milestones.length;
    const completedMilestones = scholar.milestones.filter((item) =>
      ["completed", "approved", "done"].includes(item.status.toLowerCase())
    );
    const completionPercent = totalMilestones
      ? Math.round((completedMilestones.length / totalMilestones) * 100)
      : 0;

    const upcomingMilestones = scholar.milestones
      .filter(
        (item) =>
          !["completed", "approved", "done"].includes(item.status.toLowerCase())
      )
      .sort((a, b) => {
        const aDate = a.expectedBy ?? new Date(8640000000000000);
        const bDate = b.expectedBy ?? new Date(8640000000000000);
        if (aDate.getTime() !== bDate.getTime()) {
          return aDate.getTime() - bDate.getTime();
        }
        return (a.milestone?.order ?? 0) - (b.milestone?.order ?? 0);
      });

    const nextMilestone = upcomingMilestones[0];

    return {
      id: scholar.id,
      name: personName(scholar.user),
      programName: scholar.program?.name ?? null,
      status: scholar.status,
      researchTitle: scholar.researchTitle,
      specialization: scholar.specialization,
      completionPercent,
      nextMilestoneName: nextMilestone?.milestone?.name ?? null,
      nextMilestoneDue: nextMilestone?.expectedBy
        ? nextMilestone.expectedBy.toISOString()
        : null,
      assignedAt: assignedAt.toISOString(),
    };
  });

  return {
    profile: {
      id: supervisor.id,
      name: personName(supervisor.user),
      email: supervisor.user?.email ?? null,
      designation: supervisor.designation ?? null,
      department: supervisor.department?.name ?? null,
      workloadTarget: supervisor.workloadTarget ?? null,
      activeScholarCount: scholars.length,
    },
    metrics: {
      activeScholars: scholars.length,
      documentsAwaitingReview: documents.length,
      upcomingMeetings: meetings.length,
      activeThreads: threads.length,
    },
    scholars,
    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      status: document.status,
      updatedAt: document.updatedAt.toISOString(),
      scholarName: personName(document.scholar?.user ?? undefined),
    })),
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      scheduledFor: meeting.scheduledFor.toISOString(),
      status: meeting.status,
      location: meeting.location,
      organizerName: personName(meeting.organizer.user ?? undefined),
    })),
    threads: threads.map((thread) => {
      const lastMessage = thread.messages[0];
      return {
        id: thread.id,
        subject: thread.subject ?? "General updates",
        updatedAt: thread.updatedAt.toISOString(),
        lastMessageSnippet: lastMessage?.body ?? null,
        lastAuthorName: lastMessage ? personName(lastMessage.author) : null,
      };
    }),
  };
}
