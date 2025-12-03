import { NextRequest, NextResponse } from "next/server";

import { ZodError } from "zod";

import { inviteScholar, listScholars } from "@/lib/admin/scholars";
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

    const scholars = await listScholars(membership.tenantId);
    return NextResponse.json(scholars);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin scholars API error", error);
    return NextResponse.json(
      { error: "Unable to load scholars" },
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

    const invite = await inviteScholar({
      tenantId: membership.tenantId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation payload", details: error.flatten() },
        { status: 422 }
      );
    }

    if (
      error instanceof Error &&
      (error.message === "A user with this email already exists." ||
        error.message === "Scholar role is not configured for this tenant")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Invite scholar API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to invite scholar",
      },
      { status: 500 }
    );
  }
}
