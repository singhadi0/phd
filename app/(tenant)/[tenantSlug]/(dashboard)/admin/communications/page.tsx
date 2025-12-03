import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCommunicationsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Communication center
                </h1>
                <p className="text-sm text-muted-foreground">
                    Coordinate broadcasts, messaging threads, and notification templates for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Messaging operations
                    </CardTitle>
                    <CardDescription>
                        Segmented broadcasts, supervisor escalations, and notification workflows will be orchestrated here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We will connect this view to the upcoming message threads API, include delivery analytics, and surface scheduled reminders once the job queue lands.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
