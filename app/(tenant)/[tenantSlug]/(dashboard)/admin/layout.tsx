import type { ReactNode } from "react";
import { RoleKey } from "@prisma/client";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/dashboard-shell";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { getDashboardNavigation } from "@/lib/navigation/dashboard";

export default async function AdminLayout({
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
        roleKey: [RoleKey.ADMIN, RoleKey.SUPER_ADMIN],
    });

    if (!hasAnyRole(membership, MANAGEMENT_ROLES)) {
        notFound();
    }

    const navItems = await getDashboardNavigation({
        tenantId: membership.tenantId,
        tenantSlug: membership.tenantSlug,
        membershipId: membership.membershipId,
        roleKey: membership.roleKey,
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
            settingsHref={`/${tenantSlug}/admin/settings`}
        >
            {children}
        </DashboardShell>
    );
}
