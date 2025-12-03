import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSettingsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Tenant settings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Control branding, access policies, feature flags, and integrations for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Configuration panel
                    </CardTitle>
                    <CardDescription>
                        Theme editors, RBAC mappings, and environment hooks will surface in this section.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We will wire this to Prisma tenant metadata, expose audit trails for configuration changes, and add developer sandbox controls in future iterations.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
