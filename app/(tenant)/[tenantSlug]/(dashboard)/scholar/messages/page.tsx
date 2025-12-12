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

export default async function ScholarMessagesPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: "SCHOLAR",
    });

    if (membership.roleKey !== "SCHOLAR") {
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
                    Messages & notifications
                </h1>
                <p className="text-sm text-muted-foreground">
                    Stay aligned with supervisors and admin teams within {membership.tenantName}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                    title="Active threads"
                    value={inbox.stats.totalThreads.toString()}
                    description="Conversations you are part of"
                />
                <MetricCard
                    title="Unread"
                    value={inbox.stats.unreadThreads.toString()}
                    description="Threads with new updates"
                />
                <MetricCard
                    title="Messages (7d)"
                    value={inbox.stats.messagesLastWeek.toString()}
                    description="Replies exchanged this week"
                />
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Conversations
                    </CardTitle>
                    <CardDescription>
                        Threads with supervisors, admins, and tenant broadcasts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {inbox.threads.length ? (
                        inbox.threads.map((thread) => (
                            <div
                                key={thread.id}
                                className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {thread.subject ?? "Untitled thread"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {thread.participantNames.join(", ")}
                                        </p>
                                    </div>
                                    {thread.unread ? (
                                        <Badge variant="default">Unread</Badge>
                                    ) : null}
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
                            No messages yet. Broadcasts and supervisor responses will appear here.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
