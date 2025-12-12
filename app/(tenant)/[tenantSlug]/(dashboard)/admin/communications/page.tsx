import { notFound } from "next/navigation";

import type { RoleKey } from "@prisma/client";

import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { BroadcastComposer } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/broadcast-composer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { requireSession } from "@/lib/auth/session";
import { getAdminCommunicationsSummary } from "@/lib/admin/communications";

function formatDateTime(value: string | null) {
    if (!value) {
        return "—";
    }
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default async function AdminCommunicationsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: ["ADMIN", "SUPER_ADMIN"],
    });

    if (membership.roleKey !== "ADMIN" && membership.roleKey !== "SUPER_ADMIN") {
        notFound();
    }

    const summary = await getAdminCommunicationsSummary({ tenantId: membership.tenantId });

    const roleLabel = (role: RoleKey) => {
        switch (role) {
            case "SUPERVISOR":
                return "Supervisor";
            case "SCHOLAR":
                return "Scholar";
            case "DEVELOPER":
                return "Developer";
            case "SUPER_ADMIN":
                return "Super admin";
            case "ADMIN":
            default:
                return "Admin";
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Communication center
                </h1>
                <p className="text-sm text-muted-foreground">
                    Coordinate broadcast messages, monitor thread health, and respond to escalations across {membership.tenantName}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Threads"
                    value={summary.metrics.totalThreads.toString()}
                    description="Conversations across tenant personas"
                />
                <MetricCard
                    title="Participants"
                    value={summary.metrics.distinctParticipants.toString()}
                    description="Unique members involved in messaging"
                />
                <MetricCard
                    title="Messages (7d)"
                    value={summary.metrics.messagesLastWeek.toString()}
                    description="Volume of communication activity this week"
                />
                <MetricCard
                    title="Broadcasts (14d)"
                    value={summary.metrics.broadcastsLastFortnight.toString()}
                    description="Announcements initiated recently"
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Compose broadcast
                        </CardTitle>
                        <CardDescription>
                            Reach scholars, supervisors, and fellow admins with a quick announcement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BroadcastComposer tenantSlug={tenantSlug} />
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Recent activity
                        </CardTitle>
                        <CardDescription>
                            Latest messages sent across all active threads
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        {summary.activity.length ? (
                            summary.activity.map((entry) => (
                                <div key={entry.id} className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{entry.author}</p>
                                            <p className="text-xs text-muted-foreground">{entry.subject ?? "Untitled thread"}</p>
                                        </div>
                                        <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                            {formatDateTime(entry.sentAt)}
                                        </span>
                                    </div>
                                    <Separator className="my-2" />
                                    <p className="text-sm text-muted-foreground">{entry.body}</p>
                                </div>
                            ))
                        ) : (
                            <p>No messages exchanged yet.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Thread inventory
                    </CardTitle>
                    <CardDescription>
                        Monitor participants and freshness of discussions across the tenant
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-64">Subject</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead className="text-center">Messages</TableHead>
                                <TableHead className="text-right">Last message</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.threads.length ? (
                                summary.threads.map((thread) => (
                                    <TableRow key={thread.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{thread.subject}</div>
                                            <p className="text-xs text-muted-foreground">Owned by {thread.createdBy}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {Array.from(new Set(thread.participantRoles)).map((role) => (
                                                    <Badge key={`${thread.id}-${role}`} variant="outline" className="border-border/60 text-foreground">
                                                        {roleLabel(role)}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {thread.participantNames.join(", ")}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-foreground">{thread.totalMessages}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            <div className="text-foreground">{thread.lastMessageAuthor ?? "—"}</div>
                                            <div>{formatDateTime(thread.lastMessageAt)}</div>
                                            {thread.lastMessageSnippet ? (
                                                <p className="mt-1 line-clamp-2 text-[0.7rem] text-muted-foreground">
                                                    {thread.lastMessageSnippet}
                                                </p>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                        No communication threads are active yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
