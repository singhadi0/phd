import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DeveloperFeatureFlagsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Feature flag registry
                </h1>
                <p className="text-sm text-muted-foreground">
                    Toggle experiments and rollout plans for {tenantSlug}. This workspace keeps tenant safe-guards top of mind.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Configuration coming soon
                    </CardTitle>
                    <CardDescription>
                        We will expose per-tenant overrides, rollout cohorts, and analytics before enabling live toggles here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The implementation will integrate with the feature flag service backing research and consultancy, including history, drift detection, and audit logging.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
