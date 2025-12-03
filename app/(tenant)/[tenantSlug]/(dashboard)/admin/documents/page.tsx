import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDocumentsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Document workflow
                </h1>
                <p className="text-sm text-muted-foreground">
                    Review, approve, and archive submissions for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Review and approvals hub
                    </CardTitle>
                    <CardDescription>
                        Document state transitions, reviewer routing, and audit notes will render here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The next milestone is wiring this table to Prisma documents, exposing filters, and integrating with the signed URL service for secure previews.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
