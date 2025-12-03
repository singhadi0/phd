import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorMessagesPage({
    params,
}: {
    params: { tenantSlug: string };
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Conversation center
                </h1>
                <p className="text-sm text-muted-foreground">
                    Collaborate with scholars, co-supervisors, and administrators across {params.tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Messaging roadmap
                    </CardTitle>
                    <CardDescription>
                        We will surface threaded messages, status chips, and quick follow-up actions once the communications API lands.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Expect filters for unread mentions, attachments, and scholar cohorts in this view soon.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
