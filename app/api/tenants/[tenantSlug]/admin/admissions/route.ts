import { NextRequest, NextResponse } from "next/server";

import { ZodError } from "zod";

import { createAdmission, listAdmissions } from "@/lib/admin/admissions";
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

    const admissions = await listAdmissions(membership.tenantId);
    return NextResponse.json(admissions);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin admissions API error", error);
    return NextResponse.json(
      { error: "Unable to load admissions" },
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

    const admission = await createAdmission({
      tenantId: membership.tenantId,
      programId: payload.programId,
      pathway: payload.pathway,
      status: payload.status,
      applicant: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
      },
      notes: payload.notes,
      source: payload.source,
      metadata: payload.metadata,
    });

    return NextResponse.json(admission, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid admission payload", details: error.flatten() },
        { status: 422 }
      );
    }

    console.error("Create admission API error", error);
    return NextResponse.json(
      { error: "Unable to create admission" },
      { status: 500 }
    );
  }
}
