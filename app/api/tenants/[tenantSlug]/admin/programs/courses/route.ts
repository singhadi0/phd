import { NextRequest, NextResponse } from "next/server";

import { createCourse } from "@/lib/admin/programs";
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

    const course = await createCourse({
      tenantId: membership.tenantId,
      programId: payload.programId,
      code: payload.code,
      title: payload.title,
      credits: Number(payload.credits),
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Create course API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create course",
      },
      { status: 500 }
    );
  }
}
