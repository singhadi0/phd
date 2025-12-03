import { notFound } from "next/navigation";
import { Code2, Users2, Wand2 } from "lucide-react";

import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSession } from "@/lib/auth/session";
import { getDeveloperDashboardSummary } from "@/lib/dashboard/developer";
import { ensureTenantMembership } from "@/lib/auth/navigation";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default async function DeveloperOverviewPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: "DEVELOPER",
    });

    if (membership.roleKey !== "DEVELOPER") {
        notFound();
    }

    const summary = await getDeveloperDashboardSummary({
        tenantId: membership.tenantId,
    });

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Developer observability
                </h1>
                <p className="text-sm text-muted-foreground">
                    Keep an eye on tenant health, feature flags, and audit activity for {membership.tenantName}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Active memberships"
                    value={summary.metrics.activeMemberships.toString()}
                    description="Users currently provisioned within this tenant"
                    icon={Users2}
                />
                <MetricCard
                    title="Scholar profiles"
                    value={summary.metrics.scholars.toString()}
                    description="Tracked scholar records linked to this workspace"
                    icon={Code2}
                />
                <MetricCard
                    title="Supervisor profiles"
                    value={summary.metrics.supervisors.toString()}
                    description="Faculty or mentor records available for assignments"
                    icon={Wand2}
                />
                <MetricCard
                    title="Programs configured"
                    value={summary.metrics.programs.toString()}
                    description="Academic programs ready for admissions and enrolments"
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Dataset health
                        </CardTitle>
                        <CardDescription>
                            Quick indicators to validate data pipelines before you ship changes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                            <span>Draft documents</span>
                            <span className="font-semibold text-foreground">
                                {summary.datasetHealth.documentsInDraft}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                            <span>Submissions in review</span>
                            <span className="font-semibold text-foreground">
                                {summary.datasetHealth.documentsInReview}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                            <span>Unread notifications</span>
                            <span className="font-semibold text-foreground">
                                {summary.datasetHealth.unreadNotifications}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                            <span>Meetings next 14 days</span>
                            <span className="font-semibold text-foreground">
                                {summary.datasetHealth.meetingsNextFortnight}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Feature flags
                        </CardTitle>
                        <CardDescription>
                            Recently updated flags to review before deploying new features
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        {summary.featureFlags.length ? (
                            summary.featureFlags.map((flag) => (
                                <div key={flag.id} className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-foreground">{flag.key}</p>
                                        <Badge variant={flag.defaultOn ? "default" : "secondary"}>
                                            {flag.defaultOn ? "Default on" : "Default off"}
                                        </Badge>
                                    </div>
                                    {flag.description ? (
                                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                                    ) : null}
                                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                        Updated {formatDate(flag.updatedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p>No feature flags configured yet.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Audit trail excerpts
                    </CardTitle>
                    <CardDescription>
                        Inspect recent system actions, configuration updates, and sync events
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {summary.auditTrail.length ? (
                        summary.auditTrail.map((log) => (
                            <div key={log.id} className="rounded-xl border border-border/60 bg-background/80 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                                    <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                        {formatDate(log.createdAt)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Actor: {log.actorName}
                                </p>
                                {log.context ? (
                                    <>
                                        <Separator className="my-3" />
                                        <pre className="max-h-40 overflow-auto rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                            {JSON.stringify(log.context, null, 2)}
                                        </pre>
                                    </>
                                ) : null}
                            </div>
                        ))
                    ) : (
                        <p>No audit events recorded yet for this tenant.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
