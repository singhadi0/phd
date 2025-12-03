import { DocumentStatus, MeetingStatus } from "@prisma/client";

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

export type DeveloperDashboardSummary = {
  metrics: {
    activeMemberships: number;
    scholars: number;
    supervisors: number;
    programs: number;
  };
  datasetHealth: {
    documentsInDraft: number;
    documentsInReview: number;
    unreadNotifications: number;
    meetingsNextFortnight: number;
  };
  featureFlags: Array<{
    id: string;
    key: string;
    description: string | null;
    defaultOn: boolean;
    updatedAt: string;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    actorName: string;
    context: unknown;
    createdAt: string;
  }>;
};

export async function getDeveloperDashboardSummary({
  tenantId,
}: {
  tenantId: string;
}): Promise<DeveloperDashboardSummary> {
  const now = new Date();
  const fortnightAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    membershipCount,
    scholarCount,
    supervisorCount,
    programCount,
    documentsDraft,
    documentsReview,
    unreadNotifications,
    meetingsUpcoming,
    featureFlags,
    auditTrail,
  ] = await Promise.all([
    prisma.tenantMembership.count({
      where: { tenantId, status: "active" },
    }),
    prisma.scholarProfile.count({ where: { tenantId } }),
    prisma.supervisorProfile.count({ where: { tenantId } }),
    prisma.program.count({ where: { tenantId } }),
    prisma.document.count({
      where: { tenantId, status: DocumentStatus.DRAFT },
    }),
    prisma.document.count({
      where: {
        tenantId,
        status: { in: [DocumentStatus.SUBMITTED, DocumentStatus.UNDER_REVIEW] },
      },
    }),
    prisma.notification.count({
      where: { tenantId, readAt: null },
    }),
    prisma.meeting.count({
      where: {
        tenantId,
        scheduledFor: { gte: now, lte: fortnightAhead },
        status: { in: [MeetingStatus.REQUESTED, MeetingStatus.CONFIRMED] },
      },
    }),
    prisma.featureFlag.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: {
          select: {
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  return {
    metrics: {
      activeMemberships: membershipCount,
      scholars: scholarCount,
      supervisors: supervisorCount,
      programs: programCount,
    },
    datasetHealth: {
      documentsInDraft: documentsDraft,
      documentsInReview: documentsReview,
      unreadNotifications,
      meetingsNextFortnight: meetingsUpcoming,
    },
    featureFlags: featureFlags.map((flag) => ({
      id: flag.id,
      key: flag.key,
      description: flag.description ?? null,
      defaultOn: flag.defaultOn,
      updatedAt: flag.updatedAt.toISOString(),
    })),
    auditTrail: auditTrail.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actorName: personName(entry.user ?? undefined),
      context: entry.context,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}
