import Link from "next/link";
import { RoleKey } from "@prisma/client";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";

export default async function TenantHome({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
    });

    const routes: Array<{ label: string; description: string; href: string }> = [];

    if (hasAnyRole(membership, MANAGEMENT_ROLES)) {
        routes.push({
            label: "Admin Console",
            description: "Configure programs, monitor admissions, and oversee finances.",
            href: `/${tenantSlug}/admin`,
        });
    }

    if (membership.roleKey === RoleKey.SCHOLAR) {
        routes.push({
            label: "Scholar Workspace",
            description: "Track milestones, upload documents, and review meeting notes.",
            href: `/${tenantSlug}/scholar`,
        });
    }

    if (membership.roleKey === RoleKey.SUPERVISOR) {
        routes.push({
            label: "Supervisor Hub",
            description: "Review scholar progress, manage meetings, and coordinate documents.",
            href: `/${tenantSlug}/supervisor`,
        });
    }

    if (membership.roleKey === RoleKey.DEVELOPER) {
        routes.push({
            label: "Developer Console",
            description: "Monitor feature flags, audit trails, and integration health.",
            href: `/${tenantSlug}/developer`,
        });
    }

    if (routes.length === 1) {
        redirect(routes[0].href);
    }

    if (!routes.length) {
        return (
            <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-12">
                <Card className="w-full border-border/60 bg-card/70 shadow-sm shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Dashboard setup in progress
                        </CardTitle>
                        <CardDescription>
                            The {membership.roleName.toLowerCase()} experience is not configured yet for this tenant. Please contact your administrator for access.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col justify-center gap-8 px-6 py-12">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">Choose how you want to work</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    research and consultancy detected multiple workspaces for your account. Pick the interface that best matches the task you want to complete right now.
                </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
                {routes.map((route) => (
                    <Card key={route.href} className="border-border/60 bg-card/70 shadow-sm shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                                {route.label}
                            </CardTitle>
                            <CardDescription>{route.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href={route.href}>Open {route.label.toLowerCase()}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
