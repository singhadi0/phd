import { NextRequest, NextResponse } from "next/server";

import {
  createBroadcastThread,
  getAdminCommunicationsSummary,
} from "@/lib/admin/communications";
import {
  ForbiddenError,
  UnauthorizedError,
  requireMembership,
  requireSession,
} from "@/lib/auth/session";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";

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

    const summary = await getAdminCommunicationsSummary({
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

    console.error("Admin communications API error", error);
    return NextResponse.json(
      { error: "Unable to load communications" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const payload = await request.json();
    const { subject, body, audiences } = payload ?? {};

    const result = await createBroadcastThread({
      tenantId: membership.tenantId,
      createdByMembershipId: membership.membershipId,
      subject: typeof subject === "string" ? subject : "",
      body: typeof body === "string" ? body : "",
      audiences: Array.isArray(audiences) ? audiences : [],
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Create broadcast API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create broadcast",
      },
      { status: 500 }
    );
  }
}
