import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TenantSettingsForm } from "@/app/(tenant)/[tenantSlug]/(dashboard)/admin/_components/tenant-settings-form";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { requireSession } from "@/lib/auth/session";
import { getTenantSettings } from "@/lib/admin/settings";

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default async function AdminSettingsPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: ["ADMIN", "SUPER_ADMIN"],
    });

    if (membership.roleKey !== "ADMIN" && membership.roleKey !== "SUPER_ADMIN") {
        notFound();
    }

    const settings = await getTenantSettings({ tenantId: membership.tenantId });

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Tenant settings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage contact information and descriptive copy for {membership.tenantName}.
                </p>
            </div>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            General configuration
                        </CardTitle>
                        <CardDescription>
                            Update tenant name, contact channels, and presentation details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TenantSettingsForm tenantSlug={tenantSlug} initialSettings={settings} />
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Snapshot
                        </CardTitle>
                        <CardDescription>
                            Quick reference for tenant metadata and recent updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Slug</p>
                            <p className="font-medium text-foreground">{settings.slug}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary email</p>
                            <p className="font-medium text-foreground">{settings.contactEmail ?? "Not provided"}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary phone</p>
                            <p className="font-medium text-foreground">{settings.contactPhone ?? "Not provided"}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</p>
                            <p className="font-medium text-foreground">{formatDateTime(settings.updatedAt)}</p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
