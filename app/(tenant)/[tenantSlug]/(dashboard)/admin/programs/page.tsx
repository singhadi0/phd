import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { CourseCreateForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/course-create-form";
import { ProgramCreateForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/program-create-form";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";
import type { AdminProgramList } from "@/lib/admin/programs";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
    }).format(new Date(value));
}

export default async function AdminProgramsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    const programs = await fetchTenantApi<AdminProgramList>(
        tenantSlug,
        "/admin/programs"
    );

    const programOptions = programs.items.map((program) => ({
        id: program.id,
        name: program.name,
    }));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Program configuration
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage program structures, coursework, and milestones for {tenantSlug}.
                </p>
            </div>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                    title="Programs"
                    value={programs.stats.totalPrograms.toString()}
                    description="Active program blueprints"
                />
                <MetricCard
                    title="Courses"
                    value={programs.stats.totalCourses.toString()}
                    description="Courses attached to the catalog"
                />
                <MetricCard
                    title="Milestones"
                    value={programs.stats.totalMilestones.toString()}
                    description="Milestone checkpoints across programs"
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Create program
                        </CardTitle>
                        <CardDescription>
                            Add a new doctoral track or specialization offering.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProgramCreateForm tenantSlug={tenantSlug} />
                    </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Add course to program
                        </CardTitle>
                        <CardDescription>
                            Expand curriculum with modules scoped to each program.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CourseCreateForm tenantSlug={tenantSlug} programs={programOptions} />
                        {programOptions.length > 0 ? null : (
                            <p className="mt-4 text-xs text-muted-foreground">
                                Create a program before adding courses to it.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Program inventory
                    </CardTitle>
                    <CardDescription>
                        Overview of program duration, department, and curriculum depth
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-60">Program</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead className="text-center">Courses</TableHead>
                                <TableHead className="text-center">Milestones</TableHead>
                                <TableHead className="text-right">Duration</TableHead>
                                <TableHead className="text-right">Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programs.items.length ? (
                                programs.items.map((program) => (
                                    <TableRow key={program.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{program.name}</div>
                                            {program.code ? (
                                                <div className="text-xs text-muted-foreground">{program.code}</div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {program.departmentName ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-foreground">
                                            {program.courseCount}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-foreground">
                                            {program.milestoneCount}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {program.durationMonths} months
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {formatDate(program.updatedAt)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                        No programs have been defined yet.
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
