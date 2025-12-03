import { NextRequest, NextResponse } from "next/server";

import { createFeeEntry } from "@/lib/admin/scholars";
import {
  ForbiddenError,
  UnauthorizedError,
  requireMembership,
  requireSession,
} from "@/lib/auth/session";
import { MANAGEMENT_ROLES, hasAnyRole } from "@/lib/auth/rbac";

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
    const entry = await createFeeEntry({
      tenantId: membership.tenantId,
      scholarId: payload.scholarId,
      type: payload.type,
      amount: payload.amount,
      currency: payload.currency,
      dueDate: payload.dueDate,
      paidAt: payload.paidAt,
      description: payload.description,
      referenceNumber: payload.referenceNumber,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Create fee entry API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create fee entry",
      },
      { status: 500 }
    );
  }
}
