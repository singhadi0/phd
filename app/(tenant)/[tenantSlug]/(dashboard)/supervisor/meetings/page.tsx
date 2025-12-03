import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorMeetingsPage({
    params,
}: {
    params: { tenantSlug: string };
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Meeting planner
                </h1>
                <p className="text-sm text-muted-foreground">
                    Coordinate scholar progress reviews, committee check-ins, and defence rehearsals for {params.tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Scheduling toolkit
                    </CardTitle>
                    <CardDescription>
                        We will embed agenda templates, availability insights, and quick sync actions once calendaring APIs are wired.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Expect filters by meeting status, outcome logging, and follow-up task generation in this space.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
