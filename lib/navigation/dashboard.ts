import {
  AdmissionStatus,
  DocumentStatus,
  MeetingStatus,
  RoleKey,
} from "@prisma/client";

import prisma from "@/lib/db";
import type { NavigationItem } from "@/lib/navigation/types";

const ADMISSION_ATTENTION_STATUSES: AdmissionStatus[] = [
  AdmissionStatus.APPLIED,
  AdmissionStatus.VERIFIED,
  AdmissionStatus.INTERVIEW_SCHEDULED,
  AdmissionStatus.FEE_PENDING,
  AdmissionStatus.WAITLISTED,
];

const REVIEW_DOCUMENT_STATUSES: DocumentStatus[] = [
  DocumentStatus.SUBMITTED,
  DocumentStatus.UNDER_REVIEW,
];

const UPCOMING_MEETING_STATUSES: MeetingStatus[] = [
  MeetingStatus.REQUESTED,
  MeetingStatus.CONFIRMED,
];

function formatBadge(count: number): string | undefined {
  if (count <= 0) {
    return undefined;
  }
  if (count > 99) {
    return "99+";
  }
  return String(count);
}

async function countUnreadThreads(params: {
  tenantId: string;
  membershipId: string;
}): Promise<number> {
  const threads = await prisma.messageThread.findMany({
    where: {
      tenantId: params.tenantId,
      participants: {
        some: {
          membershipId: params.membershipId,
        },
      },
    },
    select: {
      id: true,
      updatedAt: true,
      participants: {
        where: { membershipId: params.membershipId },
        select: { lastReadAt: true },
      },
    },
  });

  return threads.filter((thread) => {
    const participant = thread.participants[0];
    if (!participant) {
      return false;
    }
    if (!participant.lastReadAt) {
      return true;
    }
    return participant.lastReadAt < thread.updatedAt;
  }).length;
}

async function buildAdminNav(context: {
  tenantId: string;
  tenantSlug: string;
  membershipId: string;
}): Promise<NavigationItem[]> {
  const [
    inactiveMembers,
    pendingAdmissions,
    reviewDocuments,
    outstandingFees,
    totalPrograms,
    totalScholars,
    unreadThreads,
  ] = await Promise.all([
    prisma.tenantMembership.count({
      where: {
        tenantId: context.tenantId,
        status: {
          not: "active",
        },
      },
    }),
    prisma.admission.count({
      where: {
        tenantId: context.tenantId,
        status: {
          in: ADMISSION_ATTENTION_STATUSES,
        },
      },
    }),
    prisma.document.count({
      where: {
        tenantId: context.tenantId,
        status: {
          in: REVIEW_DOCUMENT_STATUSES,
        },
      },
    }),
    prisma.feeLedgerEntry.count({
      where: {
        tenantId: context.tenantId,
        paidAt: null,
        type: "fee",
      },
    }),
    prisma.program.count({ where: { tenantId: context.tenantId } }),
    prisma.scholarProfile.count({ where: { tenantId: context.tenantId } }),
    countUnreadThreads({
      tenantId: context.tenantId,
      membershipId: context.membershipId,
    }),
  ]);

  return [
    {
      title: "Overview",
      href: `/${context.tenantSlug}/admin`,
      icon: "LayoutDashboard",
    },
    {
      title: "Users",
      href: `/${context.tenantSlug}/admin/users`,
      icon: "UserCog",
      badge: formatBadge(inactiveMembers),
    },
    {
      title: "Admissions",
      href: `/${context.tenantSlug}/admin/admissions`,
      icon: "GraduationCap",
      badge: formatBadge(pendingAdmissions),
    },
    {
      title: "Programs",
      href: `/${context.tenantSlug}/admin/programs`,
      icon: "Building2",
      badge: formatBadge(totalPrograms),
    },
    {
      title: "Scholars",
      href: `/${context.tenantSlug}/admin/scholars`,
      icon: "Users",
      badge: formatBadge(totalScholars),
    },
    {
      title: "Finance",
      href: `/${context.tenantSlug}/admin/finance`,
      icon: "Wallet",
      badge: formatBadge(outstandingFees),
    },
    {
      title: "Documents",
      href: `/${context.tenantSlug}/admin/documents`,
      icon: "FileStack",
      badge: formatBadge(reviewDocuments),
    },
    {
      title: "Communications",
      href: `/${context.tenantSlug}/admin/communications`,
      icon: "MessageSquare",
      badge: formatBadge(unreadThreads),
    },
    {
      title: "Settings",
      href: `/${context.tenantSlug}/admin/settings`,
      icon: "Settings2",
    },
  ];
}

async function buildScholarNav(context: {
  tenantId: string;
  tenantSlug: string;
  membershipId: string;
}): Promise<NavigationItem[]> {
  const profile = await prisma.scholarProfile.findUnique({
    where: {
      membershipId: context.membershipId,
    },
    select: {
      id: true,
    },
  });

  if (!profile) {
    return [
      {
        title: "Overview",
        href: `/${context.tenantSlug}/scholar`,
        icon: "LayoutDashboard",
      },
    ];
  }

  const [
    activeEnrollments,
    reviewDocuments,
    upcomingMeetings,
    outstandingFees,
    unreadThreads,
  ] = await Promise.all([
    prisma.scholarCourseEnrollment.count({
      where: {
        scholarId: profile.id,
        status: {
          not: "completed",
        },
      },
    }),
    prisma.document.count({
      where: {
        tenantId: context.tenantId,
        scholarId: profile.id,
        status: {
          in: REVIEW_DOCUMENT_STATUSES,
        },
      },
    }),
    prisma.meeting.count({
      where: {
        tenantId: context.tenantId,
        scheduledFor: {
          gte: new Date(),
        },
        status: {
          in: UPCOMING_MEETING_STATUSES,
        },
        participants: {
          some: {
            membershipId: context.membershipId,
          },
        },
      },
    }),
    prisma.feeLedgerEntry.count({
      where: {
        tenantId: context.tenantId,
        scholarId: profile.id,
        type: "fee",
        paidAt: null,
      },
    }),
    countUnreadThreads({
      tenantId: context.tenantId,
      membershipId: context.membershipId,
    }),
  ]);

  return [
    {
      title: "Overview",
      href: `/${context.tenantSlug}/scholar`,
      icon: "LayoutDashboard",
    },
    {
      title: "Coursework",
      href: `/${context.tenantSlug}/scholar/coursework`,
      icon: "GraduationCap",
      badge: formatBadge(activeEnrollments),
    },
    {
      title: "Documents",
      href: `/${context.tenantSlug}/scholar/documents`,
      icon: "FileStack",
      badge: formatBadge(reviewDocuments),
    },
    {
      title: "Meetings",
      href: `/${context.tenantSlug}/scholar/meetings`,
      icon: "CalendarClock",
      badge: formatBadge(upcomingMeetings),
    },
    {
      title: "Finance",
      href: `/${context.tenantSlug}/scholar/finance`,
      icon: "Wallet",
      badge: formatBadge(outstandingFees),
    },
    {
      title: "Messages",
      href: `/${context.tenantSlug}/scholar/messages`,
      icon: "MessageCircle",
      badge: formatBadge(unreadThreads),
    },
  ];
}

async function buildSupervisorNav(context: {
  tenantId: string;
  tenantSlug: string;
  membershipId: string;
}): Promise<NavigationItem[]> {
  const supervisor = await prisma.supervisorProfile.findUnique({
    where: {
      membershipId: context.membershipId,
    },
    select: {
      id: true,
    },
  });

  const supervisorId = supervisor?.id ?? null;

  const [managedScholars, upcomingMeetings, reviewDocuments, unreadThreads] =
    await Promise.all([
      supervisorId
        ? prisma.scholarSupervisor.count({
            where: {
              supervisorId,
              releasedAt: null,
            },
          })
        : Promise.resolve(0),
      prisma.meeting.count({
        where: {
          tenantId: context.tenantId,
          scheduledFor: {
            gte: new Date(),
          },
          status: {
            in: UPCOMING_MEETING_STATUSES,
          },
          participants: {
            some: {
              membershipId: context.membershipId,
            },
          },
        },
      }),
      supervisorId
        ? prisma.document.count({
            where: {
              tenantId: context.tenantId,
              status: {
                in: REVIEW_DOCUMENT_STATUSES,
              },
              scholar: {
                supervisors: {
                  some: {
                    supervisorId,
                    releasedAt: null,
                  },
                },
              },
            },
          })
        : Promise.resolve(0),
      countUnreadThreads({
        tenantId: context.tenantId,
        membershipId: context.membershipId,
      }),
    ]);

  return [
    {
      title: "Overview",
      href: `/${context.tenantSlug}/supervisor`,
      icon: "LayoutDashboard",
    },
    {
      title: "Onboarding",
      href: `/${context.tenantSlug}/supervisor/onboarding`,
      icon: "ListChecks",
    },
    {
      title: "Scholars",
      href: `/${context.tenantSlug}/supervisor/scholars`,
      icon: "Users",
      badge: formatBadge(managedScholars),
    },
    {
      title: "Meetings",
      href: `/${context.tenantSlug}/supervisor/meetings`,
      icon: "CalendarClock",
      badge: formatBadge(upcomingMeetings),
    },
    {
      title: "Documents",
      href: `/${context.tenantSlug}/supervisor/documents`,
      icon: "FileStack",
      badge: formatBadge(reviewDocuments),
    },
    {
      title: "Messages",
      href: `/${context.tenantSlug}/supervisor/messages`,
      icon: "MessageSquare",
      badge: formatBadge(unreadThreads),
    },
  ];
}

async function buildDeveloperNav(context: {
  tenantId: string;
  tenantSlug: string;
}): Promise<NavigationItem[]> {
  const [enabledFlags, recentAuditEntries, integrations] = await Promise.all([
    prisma.tenantFeatureFlag.count({
      where: {
        tenantId: context.tenantId,
        enabled: true,
      },
    }),
    prisma.auditLog.count({
      where: {
        tenantId: context.tenantId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.tenantFeatureFlag.count({
      where: {
        tenantId: context.tenantId,
      },
    }),
  ]);

  return [
    {
      title: "Overview",
      href: `/${context.tenantSlug}/developer`,
      icon: "LayoutDashboard",
    },
    {
      title: "Feature flags",
      href: `/${context.tenantSlug}/developer/feature-flags`,
      icon: "Flag",
      badge: formatBadge(enabledFlags),
    },
    {
      title: "Audit logs",
      href: `/${context.tenantSlug}/developer/audit`,
      icon: "ScrollText",
      badge: formatBadge(recentAuditEntries),
    },
    {
      title: "Integrations",
      href: `/${context.tenantSlug}/developer/integrations`,
      icon: "PlugZap",
      badge: formatBadge(integrations),
    },
  ];
}

export async function getDashboardNavigation(params: {
  tenantId: string;
  tenantSlug: string;
  membershipId: string;
  roleKey: RoleKey;
}): Promise<NavigationItem[]> {
  switch (params.roleKey) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return buildAdminNav(params);
    case "SCHOLAR":
      return buildScholarNav(params);
    case "SUPERVISOR":
      return buildSupervisorNav(params);
    case "DEVELOPER":
      return buildDeveloperNav(params);
    default:
      return [
        {
          title: "Workspace",
          href: `/${params.tenantSlug}`,
          icon: "LayoutDashboard",
        },
      ];
  }
}
