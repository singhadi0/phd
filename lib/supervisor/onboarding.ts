import { DocumentStatus, MeetingStatus } from "@prisma/client";

import prisma from "@/lib/db";

function personName(person?: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  if (!person) {
    return "—";
  }
  if (person.displayName && person.displayName.trim().length > 0) {
    return person.displayName.trim();
  }
  const fullName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return fullName.length ? fullName : "—";
}

function toStatus({
  complete,
  inProgress,
}: {
  complete: boolean;
  inProgress?: boolean;
}): "complete" | "in_progress" | "pending" {
  if (complete) {
    return "complete";
  }
  if (inProgress) {
    return "in_progress";
  }
  return "pending";
}

export type SupervisorOnboardingSummary = {
  completionPercent: number;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "complete";
    href: string;
  }>;
  profileHints: string[];
  scholarsNeedingIntroductions: Array<{
    assignmentId: string;
    scholarId: string;
    scholarName: string;
    programName: string | null;
    assignedAt: string;
    introductionDueBy: string;
  }>;
  documentsAwaitingReview: Array<{
    id: string;
    title: string | null;
    status: DocumentStatus;
    updatedAt: string;
    scholarName: string;
  }>;
};

export async function getSupervisorOnboardingSummary(params: {
  tenantId: string;
  membershipId: string;
}): Promise<SupervisorOnboardingSummary> {
  const supervisor = await prisma.supervisorProfile.findFirst({
    where: {
      tenantId: params.tenantId,
      membershipId: params.membershipId,
    },
    include: {
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
              membershipId: true,
              researchTitle: true,
              status: true,
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
            },
          },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });

  if (!supervisor) {
    throw new Error("Supervisor profile not found for current membership");
  }

  const activeAssignments = supervisor.scholars;
  const scholarMembershipIds = activeAssignments
    .map((assignment) => assignment.scholar.membershipId)
    .filter(Boolean) as string[];

  const [upcomingMeetings, documents] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        tenantId: params.tenantId,
        scheduledFor: {
          gte: new Date(),
        },
        status: {
          in: [MeetingStatus.REQUESTED, MeetingStatus.CONFIRMED],
        },
        participants: {
          some: {
            membershipId: params.membershipId,
          },
        },
      },
      orderBy: { scheduledFor: "asc" },
      take: 16,
      include: {
        participants: {
          select: {
            membershipId: true,
          },
        },
      },
    }),
    scholarMembershipIds.length
      ? prisma.document.findMany({
          where: {
            tenantId: params.tenantId,
            status: {
              in: [DocumentStatus.SUBMITTED, DocumentStatus.UNDER_REVIEW],
            },
            scholar: {
              membershipId: {
                in: scholarMembershipIds,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
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
  ]);

  const meetingParticipantMemberships = new Set<string>();
  for (const meeting of upcomingMeetings) {
    for (const participant of meeting.participants) {
      meetingParticipantMemberships.add(participant.membershipId);
    }
  }

  const introductionWindowMs = 14 * 24 * 60 * 60 * 1000;
  const scholarsNeedingIntroductions = activeAssignments
    .filter((assignment) => {
      const membershipId = assignment.scholar.membershipId;
      if (!membershipId) {
        return false;
      }
      if (meetingParticipantMemberships.has(membershipId)) {
        return false;
      }
      return true;
    })
    .map((assignment) => {
      const due = new Date(
        assignment.assignedAt.getTime() + introductionWindowMs
      );
      return {
        assignmentId: assignment.id,
        scholarId: assignment.scholar.id,
        scholarName: personName(assignment.scholar.user),
        programName: assignment.scholar.program?.name ?? null,
        assignedAt: assignment.assignedAt.toISOString(),
        introductionDueBy: due.toISOString(),
      };
    });

  const profileHints: string[] = [];
  if (!supervisor.department) {
    profileHints.push(
      "Select your department so admins can route scholars correctly."
    );
  }
  if (!supervisor.designation) {
    profileHints.push(
      "Add your designation to help scholars recognise your role."
    );
  }
  if (!supervisor.bio) {
    profileHints.push(
      "Provide a short bio to set expectations during introductions."
    );
  }
  if (!supervisor.availability) {
    profileHints.push("Publish availability slots to simplify scheduling.");
  }

  const introductionsComplete =
    activeAssignments.length > 0 && scholarsNeedingIntroductions.length === 0;
  const introductionsInProgress =
    activeAssignments.length > 0 &&
    scholarsNeedingIntroductions.length > 0 &&
    scholarsNeedingIntroductions.length < activeAssignments.length;

  const profileComplete =
    !!supervisor.department && !!supervisor.designation && !!supervisor.bio;
  const profileInProgress =
    [supervisor.department, supervisor.designation, supervisor.bio].filter(
      (value) => !!value
    ).length > 0;

  const availabilityComplete = !!supervisor.availability;

  const documentsAwaitingReview = documents.map((document) => ({
    id: document.id,
    title: document.title,
    status: document.status,
    updatedAt: document.updatedAt.toISOString(),
    scholarName: personName(document.scholar?.user ?? undefined),
  }));

  const steps = [
    {
      id: "complete-profile",
      title: "Complete your supervisor profile",
      description:
        "Add your designation, department, and intro bio so scholars know who they're meeting.",
      status: toStatus({
        complete: profileComplete,
        inProgress: !profileComplete && profileInProgress,
      }),
      href: "/supervisor",
    },
    {
      id: "set-availability",
      title: "Publish availability slots",
      description:
        "Share a weekly availability matrix to streamline scheduling with scholars.",
      status: toStatus({
        complete: availabilityComplete,
        inProgress: !availabilityComplete && profileComplete,
      }),
      href: "/supervisor/meetings",
    },
    {
      id: "review-assignments",
      title: "Review assigned scholars",
      description:
        "Walk through each scholar's dossier and confirm active supervision commitments.",
      status: toStatus({
        complete: activeAssignments.length > 0,
      }),
      href: "/supervisor/scholars",
    },
    {
      id: "schedule-introductions",
      title: "Schedule introduction meetings",
      description:
        "Book first-touch meetings with assigned scholars to align on goals and expectations.",
      status: toStatus({
        complete: introductionsComplete,
        inProgress: introductionsInProgress,
      }),
      href: "/supervisor/meetings",
    },
    {
      id: "clear-review-queue",
      title: "Clear the document review queue",
      description:
        "Review submissions waiting on your acknowledgement or recommendation.",
      status: toStatus({
        complete: documentsAwaitingReview.length === 0,
        inProgress:
          documentsAwaitingReview.length > 0 &&
          documentsAwaitingReview.length < 5,
      }),
      href: "/supervisor/documents",
    },
  ] as const;

  const completionScore = steps.reduce((score, step) => {
    if (step.status === "complete") {
      return score + 1;
    }
    if (step.status === "in_progress") {
      return score + 0.5;
    }
    return score;
  }, 0);

  const completionPercent = Math.round((completionScore / steps.length) * 100);

  return {
    completionPercent,
    steps: steps.map((step) => ({ ...step })),
    profileHints,
    scholarsNeedingIntroductions,
    documentsAwaitingReview,
  } satisfies SupervisorOnboardingSummary;
}
