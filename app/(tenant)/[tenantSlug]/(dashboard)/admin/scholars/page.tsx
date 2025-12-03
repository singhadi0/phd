import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { ScholarFeeForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/scholar-fee-form";
import { ScholarEnrollmentForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/scholar-enrollment-form";
import { ScholarInviteForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/scholar-invite-form";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";
import type { AdminScholarList } from "@/lib/admin/scholars";
import type { AdminProgramList } from "@/lib/admin/programs";

function formatDate(value: string | null) {
    if (!value) {
        return "Not scheduled";
    }
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
    }).format(new Date(value));
}

export default async function AdminScholarsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    const [scholars, programs] = await Promise.all([
        fetchTenantApi<AdminScholarList>(tenantSlug, "/admin/scholars"),
        fetchTenantApi<AdminProgramList>(tenantSlug, "/admin/programs"),
    ]);

    const stats = scholars.stats;
    const scholarOptions = scholars.items.map((scholar) => ({
        id: scholar.id,
        name: scholar.name,
    }));

    const courseOptions = programs.items.flatMap((program) =>
        program.courses.map((course) => ({
            id: course.id,
            name: `${course.code} - ${course.title}`,
            programName: program.name,
        }))
    );

    const hasCourseOptions = courseOptions.length > 0;
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Scholar roster
                </h1>
                <p className="text-sm text-muted-foreground">
                    Search, filter, and bulk-manage scholar records for {tenantSlug}.
                </p>
            </div>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total scholars"
                    value={stats.total.toString()}
                    description="All scholar profiles in this tenant"
                />
                <MetricCard
                    title="Active"
                    value={stats.active.toString()}
                    description="Scholars with active status"
                />
                <MetricCard
                    title="Inactive"
                    value={stats.inactive.toString()}
                    description="Scholars currently inactive or paused"
                />
                <MetricCard
                    title="Requires follow-up"
                    value={scholars.items.filter((scholar) => scholar.outstandingFees && scholar.outstandingFees.amount > 0).length.toString()}
                    description="Scholars with pending fee follow-ups"
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Invite scholar
                        </CardTitle>
                        <CardDescription>
                            Email credentials so the scholar can sign in and complete their profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScholarInviteForm tenantSlug={tenantSlug} />
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Scholar overview
                    </CardTitle>
                    <CardDescription>
                        Supervisor assignments, milestone progress, and outstanding obligations
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-60">Scholar</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Supervisors</TableHead>
                                <TableHead>Next milestone</TableHead>
                                <TableHead className="text-right">Outstanding fees</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scholars.items.length ? (
                                scholars.items.map((scholar) => {
                                    const outstanding = scholar.outstandingFees;
                                    const milestone = scholar.nextMilestone;
                                    const progressLabel = `${scholar.milestoneProgress.completed}/${scholar.milestoneProgress.total}`;
                                    return (
                                        <TableRow key={scholar.id}>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{scholar.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {scholar.email}
                                                </div>
                                                {scholar.enrollmentNumber ? (
                                                    <div className="text-xs text-muted-foreground">
                                                        Enrollment #{scholar.enrollmentNumber}
                                                    </div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={scholar.status.toLowerCase() === "active" ? "secondary" : "outline"} className="uppercase tracking-wide">
                                                    {scholar.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {scholar.programName ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {scholar.supervisorNames.length
                                                    ? scholar.supervisorNames.join(", ")
                                                    : "Not assigned"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {milestone ? (
                                                    <div>
                                                        <div className="font-medium text-foreground">
                                                            {milestone.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Due {formatDate(milestone.expectedBy ?? null)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{progressLabel} completed</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {progressLabel} milestones done
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {outstanding ? `${outstanding.currency} ${outstanding.amount.toFixed(2)}` : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={`/${tenantSlug}/admin/scholars/${scholar.id}`}
                                                    className="text-xs font-semibold text-primary hover:underline"
                                                >
                                                    View timeline
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                        No scholars found.
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
                            Record fee entry
                        </CardTitle>
                        <CardDescription>
                            Log new charges or payments against a scholar ledger.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScholarFeeForm tenantSlug={tenantSlug} scholars={scholarOptions} />
                    </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Enroll scholar in course
                        </CardTitle>
                        <CardDescription>
                            Track coursework attempts and status updates for each scholar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScholarEnrollmentForm
                            tenantSlug={tenantSlug}
                            scholars={scholarOptions}
                            courses={courseOptions}
                        />
                        {hasCourseOptions ? null : (
                            <p className="mt-4 text-xs text-muted-foreground">
                                Add courses under a program before recording enrollments.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
