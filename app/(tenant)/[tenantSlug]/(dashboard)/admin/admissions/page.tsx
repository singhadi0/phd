import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { AdmissionCreateForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/admission-create-form";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";
import type { AdminAdmissionList } from "@/lib/admin/admissions";
import type { AdminProgramList } from "@/lib/admin/programs";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default async function AdminAdmissionsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    const [admissions, programs] = await Promise.all([
        fetchTenantApi<AdminAdmissionList>(tenantSlug, "/admin/admissions"),
        fetchTenantApi<AdminProgramList>(tenantSlug, "/admin/programs"),
    ]);

    const stats = admissions.stats;
    const programOptions = programs.items.map((program) => ({
        id: program.id,
        name: program.name,
    }));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Admissions pipeline
                </h1>
                <p className="text-sm text-muted-foreground">
                    Monitor cohort applications, interview progress, and offer conversions for {tenantSlug}.
                </p>
            </div>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total applicants"
                    value={stats.total.toString()}
                    description="All applications captured this cycle"
                />
                <MetricCard
                    title="In review"
                    value={stats.pending.toString()}
                    description="Applications awaiting next action"
                />
                <MetricCard
                    title="Enrolled"
                    value={stats.enrolled.toString()}
                    description="Applicants converted to active scholars"
                />
                <MetricCard
                    title="Rejected"
                    value={stats.rejected.toString()}
                    description="Applications closed out of the funnel"
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Capture new application
                        </CardTitle>
                        <CardDescription>
                            Record applicants and tie them to a program pathway.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdmissionCreateForm tenantSlug={tenantSlug} programs={programOptions} />
                        {programOptions.length > 0 ? null : (
                            <p className="mt-4 text-xs text-muted-foreground">
                                Define a program before logging admissions for it.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Recent applications
                    </CardTitle>
                    <CardDescription>
                        Last 50 updates across the admissions pipeline
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[220px]">Applicant</TableHead>
                                <TableHead>Program</TableHead>
                                <TableHead>Pathway</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admissions.items.length ? (
                                admissions.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{item.applicantName}</div>
                                            <div className="text-xs text-muted-foreground">{item.applicantEmail}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-foreground">{item.programName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{item.pathway}</TableCell>
                                        <TableCell>
                                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                                                {item.status.replaceAll("_", " ")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {formatDate(item.updatedAt)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                                        No admissions have been recorded yet.
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
