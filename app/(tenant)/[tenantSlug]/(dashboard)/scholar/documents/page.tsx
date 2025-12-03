import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ScholarDocumentsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Document vault
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage drafts, submissions, and reviewer feedback for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Version-controlled uploads
                    </CardTitle>
                    <CardDescription>
                        Upload history, reviewer comments, and signed URLs will be exposed here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The next step is wiring this view to the documents API and providing quick actions for re-submission and status tracking.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
