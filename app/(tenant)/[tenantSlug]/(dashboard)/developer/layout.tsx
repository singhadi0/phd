import type { ReactNode } from "react";
import { RoleKey } from "@prisma/client";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/dashboard-shell";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { getDashboardNavigation } from "@/lib/navigation/dashboard";

export default async function DeveloperLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: RoleKey.DEVELOPER,
    });

    if (membership.roleKey !== RoleKey.DEVELOPER) {
        notFound();
    }

    const navItems = await getDashboardNavigation({
        tenantId: membership.tenantId,
        tenantSlug: membership.tenantSlug,
        membershipId: membership.membershipId,
        roleKey: RoleKey.DEVELOPER,
    });

    return (
        <DashboardShell
            navItems={navItems}
            tenant={{ name: membership.tenantName, slug: membership.tenantSlug }}
            user={{
                name: session.user.name ?? session.user.email,
                roleName: membership.roleName,
                email: session.user.email,
            }}
        >
            {children}
        </DashboardShell>
    );
}
