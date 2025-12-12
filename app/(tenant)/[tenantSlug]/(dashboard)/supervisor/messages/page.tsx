import { notFound } from "next/navigation";

import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { requireSession } from "@/lib/auth/session";
import { getThreadInbox } from "@/lib/communications/inbox";

function formatDateTime(value: string | null) {
    if (!value) {
        return "—";
    }
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default async function SupervisorMessagesPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: "SUPERVISOR",
    });

    if (membership.roleKey !== "SUPERVISOR") {
        notFound();
    }

    const inbox = await getThreadInbox({
        tenantId: membership.tenantId,
        membershipId: membership.membershipId,
    });

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Conversation center
                </h1>
                <p className="text-sm text-muted-foreground">
                    Coordinate guidance with scholars, co-supervisors, and administrators across {membership.tenantName}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                    title="Active threads"
                    value={inbox.stats.totalThreads.toString()}
                    description="Discussions you are part of"
                />
                <MetricCard
                    title="Unread"
                    value={inbox.stats.unreadThreads.toString()}
                    description="Threads awaiting your response"
                />
                <MetricCard
                    title="Messages (7d)"
                    value={inbox.stats.messagesLastWeek.toString()}
                    description="Activity in the past week"
                />
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Conversations
                    </CardTitle>
                    <CardDescription>
                        Threads with scholars, admins, and broadcast announcements
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {inbox.threads.length ? (
                        inbox.threads.map((thread) => (
                            <div key={thread.id} className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {thread.subject ?? "Untitled thread"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {thread.participantNames.join(", ")}
                                        </p>
                                    </div>
                                    {thread.unread ? <Badge variant="default">Unread</Badge> : null}
                                </div>
                                {thread.lastMessageSnippet ? (
                                    <p className="text-sm text-muted-foreground">{thread.lastMessageSnippet}</p>
                                ) : null}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{thread.lastMessageAuthor ?? "—"}</span>
                                    <span>{formatDateTime(thread.lastMessageAt)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No conversations yet. Broadcasts and scholar replies will show up here once messaging begins.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
