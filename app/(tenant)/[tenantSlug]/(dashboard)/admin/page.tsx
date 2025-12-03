import Link from "next/link";
import { notFound } from "next/navigation";
import {
    FileStack,
    MessageSquare,
    NotebookPen,
    Users,
    Wallet,
    CheckCircle2,
    Circle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { getAdminDashboardSummary } from "@/lib/dashboard/admin";

function titleCase(value: string) {
    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default async function AdminOverviewPage({
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

    if (!hasAnyRole(membership, MANAGEMENT_ROLES)) {
        notFound();
    }

    const dashboard = await getAdminDashboardSummary({
        tenantId: membership.tenantId,
    });

    const currency = dashboard.metrics.outstandingFeesCurrency ?? "INR";
    const onboarding = dashboard.onboarding;

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Admin control center
                </h1>
                <p className="text-sm text-muted-foreground">
                    Monitor tenant-wide operations, admissions, finance, and compliance for {membership.tenantName}.
                </p>
            </div>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Operations onboarding
                    </CardTitle>
                    <CardDescription>
                        {onboarding.completionPercent === 100
                            ? "All baseline workflows are humming. Keep monitoring dashboards for fresh activity."
                            : "Work through these checkpoints to keep admissions, finance, and compliance on track."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-medium text-foreground">{onboarding.completionPercent}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${onboarding.completionPercent}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {onboarding.steps.map((step) => {
                            const isComplete = step.status === "complete";
                            const Icon = isComplete ? CheckCircle2 : Circle;

                            return (
                                <div
                                    key={step.id}
                                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon
                                            className={isComplete ? "mt-0.5 h-5 w-5 text-emerald-500" : "mt-0.5 h-5 w-5 text-muted-foreground"}
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">{step.title}</div>
                                            <p className="text-xs text-muted-foreground">{step.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={isComplete ? "secondary" : "default"} className="uppercase tracking-wide">
                                            {isComplete ? "Complete" : "Pending"}
                                        </Badge>
                                        {step.href ? (
                                            <Link
                                                href={`/${tenantSlug}${step.href}`}
                                                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                                            >
                                                Open workspace
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Active scholars"
                    value={dashboard.metrics.activeScholars.toString()}
                    description="Profiles marked as active or enrolled"
                    icon={Users}
                />
                <MetricCard
                    title="Admissions in flight"
                    value={dashboard.metrics.pendingAdmissions.toString()}
                    description="Applications that need attention"
                    icon={NotebookPen}
                />
                <MetricCard
                    title="Documents awaiting review"
                    value={dashboard.metrics.documentsUnderReview.toString()}
                    description="Submitted or under-review documents"
                    icon={FileStack}
                />
                <MetricCard
                    title="Outstanding fees"
                    value={formatCurrency(dashboard.metrics.outstandingFees, currency)}
                    description="Pending fee line items"
                    icon={Wallet}
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Recent admissions activity
                        </CardTitle>
                        <CardDescription>
                            Latest applicants across all programs with their current status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dashboard.recentAdmissions.length ? (
                            dashboard.recentAdmissions.map((item) => (
                                <div key={item.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-foreground">
                                            {item.applicantName}
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {titleCase(item.status)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {item.programName} • {titleCase(item.pathway)} pathway
                                    </p>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        Updated {formatDate(item.updatedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No admissions activity yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Document review queue
                        </CardTitle>
                        <CardDescription>
                            Submissions that need reviewer action across tenants
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dashboard.reviewQueue.length ? (
                            dashboard.reviewQueue.map((doc) => (
                                <div key={doc.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-foreground">
                                            {doc.title ?? "Untitled document"}
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {titleCase(doc.status)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {titleCase(doc.type)} • {doc.ownerName}
                                    </p>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        Updated {formatDate(doc.updatedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">All caught up for now. Incoming submissions will appear here.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Fee follow-ups
                        </CardTitle>
                        <CardDescription>
                            Pending payments sorted by due date
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dashboard.feeAlerts.length ? (
                            dashboard.feeAlerts.map((alert) => (
                                <div key={alert.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-foreground">
                                            {alert.scholarName}
                                        </div>
                                        <span className="text-xs font-medium text-primary">
                                            {formatCurrency(alert.amount, alert.currency)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Reference: {alert.referenceNumber ?? "Not provided"}
                                    </p>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        {alert.dueDate ? `Due ${formatDate(alert.dueDate)}` : "No due date set"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No outstanding fees at the moment.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Upcoming meetings
                        </CardTitle>
                        <CardDescription>
                            Confirmed and pending meetings for the next few weeks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dashboard.upcomingMeetings.length ? (
                            dashboard.upcomingMeetings.map((meeting) => (
                                <div key={meeting.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">
                                                {meeting.title}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Organiser: {meeting.organizerName}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {titleCase(meeting.status)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                                        {formatDate(meeting.scheduledFor)} • {meeting.location ?? "Virtual"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No meetings scheduled yet.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section>
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <MessageSquare className="h-4 w-4" aria-hidden="true" /> Audit trail excerpts
                        </CardTitle>
                        <CardDescription>
                            Snapshot of recent system actions captured in the audit log
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dashboard.auditTrail.length ? (
                            dashboard.auditTrail.map((log) => (
                                <div key={log.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-foreground">
                                            {log.actorName}
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{log.action}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
