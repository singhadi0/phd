import { NextRequest, NextResponse } from "next/server";

import { getScholarDashboardSummary } from "@/lib/dashboard/scholar";
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
      roleKey: "SCHOLAR",
    });

    if (membership.roleKey !== "SCHOLAR") {
      throw new ForbiddenError("Scholar access is required for this view");
    }

    const summary = await getScholarDashboardSummary({
      tenantId: membership.tenantId,
      membershipId: membership.membershipId,
    });

    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Scholar dashboard API error", error);
    return NextResponse.json(
      { error: "Unable to load scholar dashboard summary" },
      { status: 500 }
    );
  }
}
