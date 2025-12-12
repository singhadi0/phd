import { NextRequest, NextResponse } from "next/server";

import { createDepartment, listDepartments } from "@/lib/admin/departments";
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

    const departments = await listDepartments(membership.tenantId);
    return NextResponse.json(departments);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin departments API error", error);
    return NextResponse.json(
      { error: "Unable to load departments" },
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
    const department = await createDepartment({
      tenantId: membership.tenantId,
      name: payload.name ?? "",
      code: payload.code ?? null,
      description: payload.description ?? null,
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Create department API error", error);
    const message =
      error instanceof Error ? error.message : "Unable to create department";
    const status =
      error instanceof Error &&
      /already exists for the tenant/i.test(error.message)
        ? 409
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
