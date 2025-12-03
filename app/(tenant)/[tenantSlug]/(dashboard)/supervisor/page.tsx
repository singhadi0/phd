import { notFound } from "next/navigation";
import {
    CalendarClock,
    FileStack,
    MessageSquare,
    Users2,
} from "lucide-react";

import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { getSupervisorDashboardSummary } from "@/lib/dashboard/supervisor";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default async function SupervisorOverviewPage({
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

    const summary = await getSupervisorDashboardSummary({
        tenantId: membership.tenantId,
        membershipId: membership.membershipId,
    });

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Supervisor command center
                </h1>
                <p className="text-sm text-muted-foreground">
                    Monitor scholar progress, plan meetings, and coordinate document reviews for {membership.tenantName}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Active scholars"
                    value={summary.metrics.activeScholars.toString()}
                    description="Assigned scholars currently under your supervision"
                    icon={Users2}
                />
                <MetricCard
                    title="Documents pending"
                    value={summary.metrics.documentsAwaitingReview.toString()}
                    description="Submissions awaiting your review or acknowledgement"
                    icon={FileStack}
                />
                <MetricCard
                    title="Upcoming meetings"
                    value={summary.metrics.upcomingMeetings.toString()}
                    description="Confirmed or requested meetings over the next few weeks"
                    icon={CalendarClock}
                />
                <MetricCard
                    title="Active threads"
                    value={summary.metrics.activeThreads.toString()}
                    description="Recent scholar or admin conversations requiring follow up"
                    icon={MessageSquare}
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Assigned scholars
                        </CardTitle>
                        <CardDescription>
                            Snapshot of scholar portfolios, milestone progress, and next actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.scholars.length ? (
                            summary.scholars.map((scholar) => (
                                <div key={scholar.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{scholar.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {scholar.programName ?? "Program not assigned"} • {scholar.status}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold text-primary">
                                            {scholar.completionPercent}% complete
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {scholar.researchTitle ?? "Research focus pending"}
                                    </p>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        Next milestone: {scholar.nextMilestoneName ?? "None"}
                                        {scholar.nextMilestoneDue
                                            ? ` • Due ${formatDate(scholar.nextMilestoneDue)}`
                                            : ""}
                                    </p>
                                    <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                        Assigned {formatDate(scholar.assignedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                You do not have any scholars assigned yet. Administrators can link scholars to your profile from the admin dashboard.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Upcoming meetings
                        </CardTitle>
                        <CardDescription>
                            Prioritise preparation with a quick glance at the next confirmed sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.meetings.length ? (
                            summary.meetings.map((meeting) => (
                                <div key={meeting.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Organiser: {meeting.organizerName}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {meeting.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        {formatDate(meeting.scheduledFor)} • {meeting.location ?? "Virtual"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No meetings are scheduled for the next fortnight. Coordinate with scholars or administrators to book time when needed.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Document review queue
                        </CardTitle>
                        <CardDescription>
                            Track submissions waiting on your review or recommendation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.documents.length ? (
                            summary.documents.map((document) => (
                                <div key={document.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {document.title ?? "Untitled submission"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {document.scholarName}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {document.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        Updated {formatDate(document.updatedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No scholar submissions need your attention right now. New uploads will appear here for quick triage.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Recent conversations
                        </CardTitle>
                        <CardDescription>
                            Latest scholar or admin threads with unread activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.threads.length ? (
                            summary.threads.map((thread) => (
                                <div key={thread.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-foreground">
                                            {thread.subject}
                                        </p>
                                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            {formatDate(thread.updatedAt)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {thread.lastMessageSnippet ?? "No messages yet"}
                                    </p>
                                    <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                        {thread.lastAuthorName ? `Last reply from ${thread.lastAuthorName}` : "Waiting for first response"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Conversations involving you will appear once scholars or admins start a thread.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
