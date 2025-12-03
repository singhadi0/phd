import { NextRequest, NextResponse } from "next/server";

import {
  listTenantMembers,
  updateTenantMembershipStatus,
} from "@/lib/admin/users";
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
      throw new ForbiddenError("Admin privileges are required");
    }

    const members = await listTenantMembers(membership.tenantId);

    return NextResponse.json({ data: members });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin users GET error", error);
    return NextResponse.json(
      { error: "Unable to load tenant users" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const body = await request.json();
    const session = await requireSession();
    const membership = requireMembership(session, {
      tenantSlug,
      roleKey: ["ADMIN", "SUPER_ADMIN"],
    });

    if (!hasAnyRole(membership, MANAGEMENT_ROLES)) {
      throw new ForbiddenError("Admin privileges are required");
    }

    const { membershipId, status } = body ?? {};

    if (!membershipId || !status) {
      return NextResponse.json(
        { error: "membershipId and status are required" },
        { status: 400 }
      );
    }

    const updatedMembership = await updateTenantMembershipStatus({
      tenantId: membership.tenantId,
      membershipId,
      status,
      actingMembershipId: membership.membershipId,
    });

    return NextResponse.json({ data: updatedMembership });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin users PATCH error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update membership",
      },
      { status: 500 }
    );
  }
}
