import Link from "next/link";
import type { DocumentStatus } from "@prisma/client";

import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";
import type { SupervisorOnboardingSummary } from "@/lib/supervisor/onboarding";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
    }).format(new Date(value));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function statusLabel(status: "pending" | "in_progress" | "complete") {
    switch (status) {
        case "complete":
            return "Complete";
        case "in_progress":
            return "In progress";
        default:
            return "Pending";
    }
}

function statusVariant(status: "pending" | "in_progress" | "complete") {
    switch (status) {
        case "complete":
            return "secondary" as const;
        case "in_progress":
            return "outline" as const;
        default:
            return "destructive" as const;
    }
}

function formatDocumentStatus(status: DocumentStatus) {
    switch (status) {
        case "DRAFT":
            return "Draft";
        case "SUBMITTED":
            return "Submitted";
        case "UNDER_REVIEW":
            return "Under review";
        case "APPROVED":
            return "Approved";
        case "REJECTED":
            return "Rejected";
        default:
            return status;
    }
}

export default async function SupervisorOnboardingPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const summary = await fetchTenantApi<SupervisorOnboardingSummary>(tenantSlug, "/supervisor/onboarding");

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Onboarding checklist
                </h1>
                <p className="text-sm text-muted-foreground">
                    Finish the essentials to fully activate your supervisor workspace for {tenantSlug}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Overall completion"
                    value={`${summary.completionPercent}%`}
                    description="Progress across setup steps"
                />
                <MetricCard
                    title="Checklist items"
                    value={summary.steps.length.toString()}
                    description="Steps to complete onboarding"
                />
                <MetricCard
                    title="Intro meetings pending"
                    value={summary.scholarsNeedingIntroductions.length.toString()}
                    description="Scholars awaiting introductions"
                />
                <MetricCard
                    title="Docs awaiting review"
                    value={summary.documentsAwaitingReview.length.toString()}
                    description="Submissions in your queue"
                />
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Setup checklist
                    </CardTitle>
                    <CardDescription>
                        Track key steps to unlock the full supervisor experience
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="h-2 w-full rounded-full bg-border/60">
                            <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{ width: `${Math.min(summary.completionPercent, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.completionPercent}% complete · {summary.steps.filter((step) => step.status === "complete").length} steps done
                        </p>
                    </div>
                    <div className="space-y-3">
                        {summary.steps.map((step) => {
                            const targetHref = `/${tenantSlug}${step.href}`;
                            return (
                                <div
                                    key={step.id}
                                    className="rounded-xl border border-border/60 bg-background/80 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{step.title}</p>
                                            <p className="text-xs text-muted-foreground">{step.description}</p>
                                        </div>
                                        <Badge variant={statusVariant(step.status)} className="uppercase tracking-wide">
                                            {statusLabel(step.status)}
                                        </Badge>
                                    </div>
                                    <p className="mt-3 text-xs text-primary">
                                        Next: <Link href={targetHref} className="underline underline-offset-4">Open module</Link>
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Profile hints
                        </CardTitle>
                        <CardDescription>
                            Fill in missing details so admins and scholars can collaborate smoothly
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {summary.profileHints.length ? (
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {summary.profileHints.map((hint, index) => (
                                    <li key={index} className="rounded-lg border border-border/60 bg-background/80 p-3">
                                        {hint}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Great work! Your profile is fully configured.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Scholars awaiting introductions
                        </CardTitle>
                        <CardDescription>
                            Prioritise welcome calls for newly assigned scholars
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-hidden rounded-xl border border-border/60">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Scholar</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead className="text-right">Assigned</TableHead>
                                    <TableHead className="text-right">Intro due</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.scholarsNeedingIntroductions.length ? (
                                    summary.scholarsNeedingIntroductions.map((scholar) => (
                                        <TableRow key={scholar.assignmentId}>
                                            <TableCell className="text-sm font-medium text-foreground">
                                                {scholar.scholarName}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {scholar.programName ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {formatDateTime(scholar.assignedAt)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {formatDate(scholar.introductionDueBy)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                            All scholars have an introduction meeting scheduled.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Documents awaiting review
                    </CardTitle>
                    <CardDescription>
                        Submissions needing your recommendation or feedback
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {summary.documentsAwaitingReview.length ? (
                        summary.documentsAwaitingReview.map((document) => (
                            <div key={document.id} className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {document.title ?? "Untitled submission"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {document.scholarName}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="uppercase tracking-wide">
                                        {formatDocumentStatus(document.status)}
                                    </Badge>
                                </div>
                                <Separator />
                                <p className="text-xs text-muted-foreground">
                                    Updated {formatDateTime(document.updatedAt)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No pending submissions. You are all caught up!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
