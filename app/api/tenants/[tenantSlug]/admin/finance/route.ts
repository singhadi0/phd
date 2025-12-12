import { NextRequest, NextResponse } from "next/server";

import { getAdminFinanceSummary } from "@/lib/admin/finance";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";
import {
  ForbiddenError,
  UnauthorizedError,
  requireMembership,
  requireSession,
} from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const session = await requireSession();
    const membership = requireMembership(session, {
      tenantSlug,
      roleKey: ["ADMIN", "SUPER_ADMIN"],
    });

    if (!hasAnyRole(membership, MANAGEMENT_ROLES)) {
      throw new ForbiddenError("Admin privileges required");
    }

    const summary = await getAdminFinanceSummary({
      tenantId: membership.tenantId,
    });

    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin finance API error", error);
    return NextResponse.json(
      { error: "Unable to load finance summary" },
      { status: 500 }
    );
  }
}
