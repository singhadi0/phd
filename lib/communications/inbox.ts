import type { RoleKey } from "@prisma/client";

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

function normalizeSnippet(body: string, maxLength = 180): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1)}…`;
}

export type ThreadInboxEntry = {
  id: string;
  subject: string | null;
  participantNames: string[];
  participantRoles: RoleKey[];
  lastMessageAt: string | null;
  lastMessageSnippet: string | null;
  lastMessageAuthor: string | null;
  totalMessages: number;
  unread: boolean;
};

export type ThreadInboxSummary = {
  stats: {
    totalThreads: number;
    unreadThreads: number;
    messagesLastWeek: number;
  };
  threads: ThreadInboxEntry[];
};

export async function getThreadInbox(params: {
  tenantId: string;
  membershipId: string;
  limit?: number;
}): Promise<ThreadInboxSummary> {
  const limit = Math.max(1, Math.min(params.limit ?? 12, 50));
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [totalThreads, messagesLastWeek, threads] = await Promise.all([
    prisma.messageThread.count({
      where: {
        tenantId: params.tenantId,
        participants: {
          some: { membershipId: params.membershipId },
        },
      },
    }),
    prisma.message.count({
      where: {
        thread: {
          tenantId: params.tenantId,
          participants: {
            some: { membershipId: params.membershipId },
          },
        },
        sentAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.messageThread.findMany({
      where: {
        tenantId: params.tenantId,
        participants: {
          some: { membershipId: params.membershipId },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
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

  const membershipReads = await prisma.messageThreadParticipant.findMany({
    where: {
      membershipId: params.membershipId,
      threadId: {
        in: threads.map((thread) => thread.id),
      },
    },
    select: {
      threadId: true,
      lastReadAt: true,
    },
  });
  const readMap = new Map<string, Date | null>(
    membershipReads.map((entry) => [entry.threadId, entry.lastReadAt ?? null])
  );

  const latestMessages = await Promise.all(
    threads.map((thread) =>
      prisma.message.findFirst({
        where: { threadId: thread.id },
        orderBy: { sentAt: "desc" },
        select: {
          body: true,
          sentAt: true,
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

  let unreadCount = 0;

  const entries: ThreadInboxEntry[] = threads.map((thread, index) => {
    const latestMessage = latestMessages[index];
    const lastReadAt = readMap.get(thread.id) ?? null;
    const lastMessageAt = latestMessage?.sentAt ?? null;
    const unread = lastMessageAt
      ? !lastReadAt || lastReadAt < lastMessageAt
      : false;
    if (unread) {
      unreadCount += 1;
    }

    return {
      id: thread.id,
      subject: thread.subject ?? "Untitled thread",
      participantNames: thread.participants.map((participant) =>
        personName(participant.membership.user)
      ),
      participantRoles: thread.participants
        .map((participant) => participant.membership.role?.key)
        .filter((roleKey): roleKey is RoleKey => Boolean(roleKey)),
      lastMessageAt: lastMessageAt ? lastMessageAt.toISOString() : null,
      lastMessageSnippet: latestMessage
        ? normalizeSnippet(latestMessage.body)
        : null,
      lastMessageAuthor: latestMessage
        ? personName(latestMessage.author)
        : null,
      totalMessages: thread._count.messages,
      unread,
    } satisfies ThreadInboxEntry;
  });

  return {
    stats: {
      totalThreads,
      unreadThreads: unreadCount,
      messagesLastWeek,
    },
    threads: entries,
  } satisfies ThreadInboxSummary;
}
