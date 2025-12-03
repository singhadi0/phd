import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorScholarsPage({
    params,
}: {
    params: { tenantSlug: string };
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Scholar roster
                </h1>
                <p className="text-sm text-muted-foreground">
                    Detailed scholar assignments, performance insights, and communication tools will surface here for {params.tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Upcoming work
                    </CardTitle>
                    <CardDescription>
                        This view will connect supervisor workloads, scholar milestones, and quick actions for outreach.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Once the underlying APIs are ready, this table will include filters by status, milestone, and alerts for overdue items.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
