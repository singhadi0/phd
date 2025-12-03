import { notFound } from "next/navigation";
import { AdminUsersTable } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/admin-users-table";
import { listTenantMembers } from "@/lib/admin/users";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";

export default async function AdminUsersPage({
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

    if (!hasAnyRole(membership, MANAGEMENT_ROLES)) {
        notFound();
    }

    const members = await listTenantMembers(membership.tenantId);

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tenant users</h1>
                <p className="text-sm text-muted-foreground">
                    Manage membership access, roles, and activation states for {membership.tenantName}.
                </p>
            </div>

            <AdminUsersTable
                initialMembers={members}
                tenantSlug={tenantSlug}
                actingMembershipId={membership.membershipId}
            />
        </div>
    );
}
