import type { DocumentStatus, DocumentType } from "@prisma/client";

import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";
import type { AdminDocumentSummary } from "@/lib/admin/documents";

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatStatus(status: DocumentStatus) {
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

function formatType(type: DocumentType) {
    switch (type) {
        case "SYNOPSIS":
            return "Synopsis";
        case "THESIS":
            return "Thesis";
        case "REPORT":
            return "Report";
        case "RECEIPT":
            return "Receipt";
        case "IDENTIFICATION":
            return "Identification";
        case "OTHER":
        default:
            return "Other";
    }
}

export default async function AdminDocumentsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const summary = await fetchTenantApi<AdminDocumentSummary>(tenantSlug, "/admin/documents");

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Document workflow
                </h1>
                <p className="text-sm text-muted-foreground">
                    Review, approve, and archive submissions for {tenantSlug}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <MetricCard
                    title="Total"
                    value={summary.metrics.total.toString()}
                    description="All documents tracked"
                />
                <MetricCard
                    title="Drafts"
                    value={summary.metrics.drafts.toString()}
                    description="Awaiting submission"
                />
                <MetricCard
                    title="Submitted"
                    value={summary.metrics.submitted.toString()}
                    description="Ready for triage"
                />
                <MetricCard
                    title="Under review"
                    value={summary.metrics.underReview.toString()}
                    description="Needs reviewer action"
                />
                <MetricCard
                    title="Approved"
                    value={summary.metrics.approved.toString()}
                    description="Cleared submissions"
                />
                <MetricCard
                    title="Rejected"
                    value={summary.metrics.rejected.toString()}
                    description="Requires follow-up"
                />
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Review queue
                    </CardTitle>
                    <CardDescription>
                        Submissions awaiting verification or approvals
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-60">Document</TableHead>
                                <TableHead>Scholar</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead className="text-center">Type</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.reviewQueue.length ? (
                                summary.reviewQueue.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{item.title ?? "Untitled"}</div>
                                            <div className="text-xs text-muted-foreground">{item.id}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{item.scholarName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{item.ownerName}</TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {formatType(item.type)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="uppercase tracking-wide">
                                                {formatStatus(item.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {formatDateTime(item.updatedAt)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                        No documents require review at the moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Recently approved
                        </CardTitle>
                        <CardDescription>
                            Submissions cleared in the last review cycles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.approved.length ? (
                            summary.approved.map((item) => (
                                <div key={item.id} className="space-y-1 rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.title ?? "Untitled"}</p>
                                            <p className="text-xs text-muted-foreground">{item.scholarName}</p>
                                        </div>
                                        <Badge variant="secondary" className="uppercase tracking-wide">
                                            {formatType(item.type)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Owner: {item.ownerName}</p>
                                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                        Approved {formatDateTime(item.updatedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No recent approvals yet. Approved submissions will appear here.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Recently rejected
                        </CardTitle>
                        <CardDescription>
                            Documents declined or needing resubmission
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.rejected.length ? (
                            summary.rejected.map((item) => (
                                <div key={item.id} className="space-y-1 rounded-xl border border-border/60 bg-background/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.title ?? "Untitled"}</p>
                                            <p className="text-xs text-muted-foreground">{item.scholarName}</p>
                                        </div>
                                        <Badge variant="outline" className="border-rose-400 text-rose-400">
                                            {formatType(item.type)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Owner: {item.ownerName}</p>
                                    <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                        Rejected {formatDateTime(item.updatedAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No documents have been rejected recently.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Recent uploads
                    </CardTitle>
                    <CardDescription>
                        Latest version activity across all documents
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    {summary.recentActivity.length ? (
                        summary.recentActivity.map((activity) => (
                            <div key={`${activity.id}-${activity.actionAt}`} className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{activity.title ?? "Untitled"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.fileName ?? "Uploaded file"} • {formatType(activity.type)}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="uppercase tracking-wide">
                                        {formatStatus(activity.status)}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{activity.actorName ?? "System"}</span>
                                    <span>{formatDateTime(activity.actionAt)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No uploads recorded yet. New document versions will show up here instantly.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
