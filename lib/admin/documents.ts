import { DocumentStatus, DocumentType } from "@prisma/client";

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

const REVIEW_STATUSES: DocumentStatus[] = [
  DocumentStatus.SUBMITTED,
  DocumentStatus.UNDER_REVIEW,
];

export type AdminDocumentMetrics = {
  total: number;
  drafts: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
};

export type AdminDocumentQueueItem = {
  id: string;
  title: string | null;
  type: DocumentType;
  status: DocumentStatus;
  scholarName: string;
  ownerName: string;
  updatedAt: string;
};

export type AdminDocumentActivityItem = {
  id: string;
  title: string | null;
  type: DocumentType;
  status: DocumentStatus;
  actorName: string | null;
  actionAt: string;
  fileName: string | null;
};

export type AdminDocumentSummary = {
  metrics: AdminDocumentMetrics;
  reviewQueue: AdminDocumentQueueItem[];
  approved: AdminDocumentQueueItem[];
  rejected: AdminDocumentQueueItem[];
  recentActivity: AdminDocumentActivityItem[];
};

export async function getAdminDocumentSummary(params: {
  tenantId: string;
}): Promise<AdminDocumentSummary> {
  const [statusGroups, reviewQueue, approvedDocs, rejectedDocs] =
    await Promise.all([
      prisma.document.groupBy({
        by: ["status"],
        where: { tenantId: params.tenantId },
        _count: { status: true },
      }),
      prisma.document.findMany({
        where: {
          tenantId: params.tenantId,
          status: { in: REVIEW_STATUSES },
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: {
          ownerUser: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
          scholar: {
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
      prisma.document.findMany({
        where: {
          tenantId: params.tenantId,
          status: DocumentStatus.APPROVED,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          ownerUser: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
          scholar: {
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
      prisma.document.findMany({
        where: {
          tenantId: params.tenantId,
          status: DocumentStatus.REJECTED,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          ownerUser: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
          scholar: {
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
    ]);

  const metrics: AdminDocumentMetrics = {
    total: 0,
    drafts: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  };

  statusGroups.forEach((group) => {
    const count = group._count.status ?? 0;
    metrics.total += count;
    switch (group.status) {
      case DocumentStatus.DRAFT:
        metrics.drafts += count;
        break;
      case DocumentStatus.SUBMITTED:
        metrics.submitted += count;
        break;
      case DocumentStatus.UNDER_REVIEW:
        metrics.underReview += count;
        break;
      case DocumentStatus.APPROVED:
        metrics.approved += count;
        break;
      case DocumentStatus.REJECTED:
        metrics.rejected += count;
        break;
      default:
        break;
    }
  });

  const reviewQueueItems: AdminDocumentQueueItem[] = reviewQueue.map(
    (document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      status: document.status,
      scholarName: personName(document.scholar?.user),
      ownerName: personName(document.ownerUser ?? document.scholar?.user),
      updatedAt: document.updatedAt.toISOString(),
    })
  );

  const approvedItems: AdminDocumentQueueItem[] = approvedDocs.map(
    (document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      status: document.status,
      scholarName: personName(document.scholar?.user),
      ownerName: personName(document.ownerUser ?? document.scholar?.user),
      updatedAt: document.updatedAt.toISOString(),
    })
  );

  const rejectedItems: AdminDocumentQueueItem[] = rejectedDocs.map(
    (document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      status: document.status,
      scholarName: personName(document.scholar?.user),
      ownerName: personName(document.ownerUser ?? document.scholar?.user),
      updatedAt: document.updatedAt.toISOString(),
    })
  );

  const recentActivityRaw = await prisma.documentVersion.findMany({
    where: {
      document: {
        tenantId: params.tenantId,
      },
    },
    orderBy: { uploadedAt: "desc" },
    take: 12,
    include: {
      document: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        },
      },
      uploadedBy: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const recentActivity: AdminDocumentActivityItem[] = recentActivityRaw.map(
    (version) => ({
      id: version.document.id,
      title: version.document.title,
      type: version.document.type,
      status: version.document.status,
      actorName: personName(version.uploadedBy),
      actionAt: version.uploadedAt.toISOString(),
      fileName: version.fileName,
    })
  );

  return {
    metrics,
    reviewQueue: reviewQueueItems,
    approved: approvedItems,
    rejected: rejectedItems,
    recentActivity,
  } satisfies AdminDocumentSummary;
}
