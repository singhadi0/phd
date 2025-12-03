import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { UnauthorizedError, requireSession } from "@/lib/auth/session";
import { ensureTenantMembership } from "@/lib/auth/navigation";

export default async function TenantLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    let session;
    try {
        session = await requireSession();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/login?redirect=/${tenantSlug}`);
        }
        throw error;
    }

    ensureTenantMembership(session, { tenantSlug });

    return <div className="min-h-dvh bg-muted/10 text-foreground">{children}</div>;
}
