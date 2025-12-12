import { RoleKey } from "@prisma/client";

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

function normalizeSnippet(value: string, maxLength = 160): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1)}…`;
}

export type AdminCommunicationThread = {
  id: string;
  subject: string | null;
  participantRoles: RoleKey[];
  participantNames: string[];
  createdBy: string;
  totalMessages: number;
  lastMessageAt: string | null;
  lastMessageAuthor: string | null;
  lastMessageSnippet: string | null;
};

export type AdminCommunicationActivity = {
  id: string;
  threadId: string;
  subject: string | null;
  author: string;
  body: string;
  sentAt: string;
};

export type AdminCommunicationsSummary = {
  metrics: {
    totalThreads: number;
    distinctParticipants: number;
    messagesLastWeek: number;
    broadcastsLastFortnight: number;
  };
  threads: AdminCommunicationThread[];
  activity: AdminCommunicationActivity[];
};

export async function getAdminCommunicationsSummary(params: {
  tenantId: string;
}): Promise<AdminCommunicationsSummary> {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const [
    totalThreads,
    participantGroups,
    messagesLastWeek,
    broadcastsLastFortnight,
    threads,
  ] = await Promise.all([
    prisma.messageThread.count({
      where: { tenantId: params.tenantId },
    }),
    prisma.messageThreadParticipant.groupBy({
      where: { thread: { tenantId: params.tenantId } },
      by: ["membershipId"],
    }),
    prisma.message.count({
      where: {
        thread: { tenantId: params.tenantId },
        sentAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.messageThread.count({
      where: {
        tenantId: params.tenantId,
        createdAt: { gte: fourteenDaysAgo },
      },
    }),
    prisma.messageThread.findMany({
      where: { tenantId: params.tenantId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
            role: {
              select: {
                key: true,
              },
            },
          },
        },
        participants: {
          include: {
            membership: {
              include: {
                role: {
                  select: {
                    key: true,
                  },
                },
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
        _count: {
          select: { messages: true },
        },
      },
    }),
  ]);

  const latestMessages = await Promise.all(
    threads.map((thread) =>
      prisma.message.findFirst({
        where: { threadId: thread.id },
        orderBy: { sentAt: "desc" },
        select: {
          sentAt: true,
          body: true,
          author: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    )
  );

  const threadSummaries: AdminCommunicationThread[] = threads
    .map((thread, index) => {
      const latestMessage = latestMessages[index];
      const lastActivity =
        latestMessage?.sentAt ?? thread.updatedAt ?? thread.createdAt;
      return {
        id: thread.id,
        subject: thread.subject ?? "Untitled thread",
        participantRoles: thread.participants
          .map((participant) => participant.membership.role?.key)
          .filter((roleKey): roleKey is RoleKey => Boolean(roleKey)),
        participantNames: thread.participants.map((participant) =>
          personName(participant.membership.user)
        ),
        createdBy: personName(thread.createdBy.user),
        totalMessages: thread._count.messages,
        lastMessageAt: latestMessage?.sentAt.toISOString() ?? null,
        lastMessageAuthor: latestMessage
          ? personName(latestMessage.author)
          : null,
        lastMessageSnippet: latestMessage
          ? normalizeSnippet(latestMessage.body)
          : null,
        _lastActivity: lastActivity.getTime(),
      } as AdminCommunicationThread & { _lastActivity: number };
    })
    .sort((a, b) => b._lastActivity - a._lastActivity)
    .map(({ _lastActivity, ...rest }) => rest);

  const activity = await prisma.message.findMany({
    where: { thread: { tenantId: params.tenantId } },
    orderBy: { sentAt: "desc" },
    take: 10,
    include: {
      thread: {
        select: {
          id: true,
          subject: true,
        },
      },
      author: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const activitySummaries: AdminCommunicationActivity[] = activity.map(
    (message) => ({
      id: message.id,
      threadId: message.thread.id,
      subject: message.thread.subject,
      author: personName(message.author),
      body: normalizeSnippet(message.body),
      sentAt: message.sentAt.toISOString(),
    })
  );

  return {
    metrics: {
      totalThreads,
      distinctParticipants: participantGroups.length,
      messagesLastWeek,
      broadcastsLastFortnight,
    },
    threads: threadSummaries,
    activity: activitySummaries,
  } satisfies AdminCommunicationsSummary;
}

export type BroadcastAudience = "scholars" | "supervisors" | "admins";

const AUDIENCE_ROLE_MAP: Record<BroadcastAudience, RoleKey[]> = {
  scholars: ["SCHOLAR"],
  supervisors: ["SUPERVISOR"],
  admins: ["ADMIN", "SUPER_ADMIN"],
};

export async function createBroadcastThread(params: {
  tenantId: string;
  createdByMembershipId: string;
  subject: string;
  body: string;
  audiences: BroadcastAudience[];
}) {
  const subject = params.subject.trim();
  const body = params.body.trim();
  const defaultAudiences: BroadcastAudience[] = ["scholars"];
  const resolvedAudiences = params.audiences.length
    ? params.audiences
    : defaultAudiences;

  if (!subject) {
    throw new Error("Subject is required");
  }
  if (!body) {
    throw new Error("Message body is required");
  }

  const creator = await prisma.tenantMembership.findUnique({
    where: { id: params.createdByMembershipId },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!creator || creator.tenantId !== params.tenantId) {
    throw new Error("Membership not found for tenant");
  }

  const roleKeys = new Set<RoleKey>();
  for (const audience of resolvedAudiences) {
    AUDIENCE_ROLE_MAP[audience]?.forEach((roleKey) => roleKeys.add(roleKey));
  }

  if (!roleKeys.size) {
    throw new Error("No valid audience selected");
  }

  const participants = await prisma.tenantMembership.findMany({
    where: {
      tenantId: params.tenantId,
      role: {
        key: {
          in: Array.from(roleKeys),
        },
      },
    },
    select: { id: true },
  });

  const participantIds = new Set<string>(
    participants.map((participant) => participant.id)
  );
  participantIds.add(params.createdByMembershipId);

  const result = await prisma.$transaction(async (tx) => {
    const thread = await tx.messageThread.create({
      data: {
        tenantId: params.tenantId,
        subject,
        createdById: params.createdByMembershipId,
      },
    });

    if (participantIds.size) {
      await tx.messageThreadParticipant.createMany({
        data: Array.from(participantIds).map((membershipId) => ({
          threadId: thread.id,
          membershipId,
          role:
            membershipId === params.createdByMembershipId
              ? "owner"
              : "participant",
        })),
      });
    }

    const message = await tx.message.create({
      data: {
        threadId: thread.id,
        authorId: creator.user.id,
        body,
      },
    });

    await tx.messageThreadParticipant.update({
      where: {
        threadId_membershipId: {
          threadId: thread.id,
          membershipId: params.createdByMembershipId,
        },
      },
      data: {
        lastReadAt: message.sentAt,
      },
    });

    await tx.messageThread.update({
      where: { id: thread.id },
      data: {
        updatedAt: message.sentAt,
      },
    });

    return {
      threadId: thread.id,
      messageId: message.id,
      participantCount: participantIds.size,
    };
  });

  return result;
}
