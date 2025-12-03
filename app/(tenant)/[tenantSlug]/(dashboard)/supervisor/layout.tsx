import type { ReactNode } from "react";
import { RoleKey } from "@prisma/client";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/dashboard-shell";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";
import { getDashboardNavigation } from "@/lib/navigation/dashboard";

export default async function SupervisorLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: { tenantSlug: string };
}) {
    const { tenantSlug } = params;

    const session = await requireSession();
    const membership = ensureTenantMembership(session, {
        tenantSlug,
        roleKey: RoleKey.SUPERVISOR,
    });

    if (membership.roleKey !== RoleKey.SUPERVISOR) {
        notFound();
    }

    const navItems = await getDashboardNavigation({
        tenantId: membership.tenantId,
        tenantSlug: membership.tenantSlug,
        membershipId: membership.membershipId,
        roleKey: RoleKey.SUPERVISOR,
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
            maxContentWidthClassName="max-w-5xl"
        >
            {children}
        </DashboardShell>
    );
}
