import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeveloperIntegrationsPage({
    params,
}: {
    params: { tenantSlug: string };
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Integration control plane
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage webhooks, background jobs, and API credentials scoped to {params.tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Integration scaffolding underway
                    </CardTitle>
                    <CardDescription>
                        This view will host webhook delivery logs, retry tooling, and sandbox API keys as soon as the infrastructure is ready.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We will also surface BullMQ job dashboards and environment secrets guidance once background workers are connected.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
