import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ScholarMeetingsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Meetings & actions
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage meeting requests, agendas, and outcomes for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Schedule coordination
                    </CardTitle>
                    <CardDescription>
                        Calendar sync, agenda notes, and attendance tracking will appear here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We will attach a meeting timeline, quick RSVP actions, and supervisor comments in the upcoming sprint.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
