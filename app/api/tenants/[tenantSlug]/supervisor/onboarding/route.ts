import { NextRequest, NextResponse } from "next/server";

import { getSupervisorOnboardingSummary } from "@/lib/supervisor/onboarding";
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
      roleKey: "SUPERVISOR",
    });

    const summary = await getSupervisorOnboardingSummary({
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

    console.error("Supervisor onboarding API error", error);
    return NextResponse.json(
      { error: "Unable to load onboarding summary" },
      { status: 500 }
    );
  }
}
