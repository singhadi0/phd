import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ScholarMessagesPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Messages & notifications
                </h1>
                <p className="text-sm text-muted-foreground">
                    Stay aligned with supervisors and admin teams within {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Conversation hub
                    </CardTitle>
                    <CardDescription>
                        Threaded discussions, broadcast responses, and quick replies will surface here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We will plug this into the messaging API and expose filters for threads, unread states, and attachments in an upcoming release.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
