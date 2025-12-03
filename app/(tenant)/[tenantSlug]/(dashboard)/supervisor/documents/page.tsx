import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorDocumentsPage({
    params,
}: {
    params: { tenantSlug: string };
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Document moderation
                </h1>
                <p className="text-sm text-muted-foreground">
                    Review scholar submissions, leave annotations, and coordinate approvals for {params.tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Review workflows
                    </CardTitle>
                    <CardDescription>
                        Upcoming work will surface document diffs, reviewer assignments, and status automation here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The next milestone is wiring this screen to the document pipeline so supervisors can approve, reject, or request edits inline.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
