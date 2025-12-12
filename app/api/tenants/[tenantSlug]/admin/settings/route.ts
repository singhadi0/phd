import { NextRequest, NextResponse } from "next/server";

import { getTenantSettings, updateTenantSettings } from "@/lib/admin/settings";
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

    const settings = await getTenantSettings({ tenantId: membership.tenantId });
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Admin settings API error", error);
    return NextResponse.json(
      { error: "Unable to load tenant settings" },
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
    const session = await requireSession();
    const membership = requireMembership(session, {
      tenantSlug,
      roleKey: ["ADMIN", "SUPER_ADMIN"],
    });

    if (!hasAnyRole(membership, MANAGEMENT_ROLES)) {
      throw new ForbiddenError("Admin privileges required");
    }

    const payload = await request.json();
    const name = typeof payload?.name === "string" ? payload.name : "";
    const description =
      typeof payload?.description === "string" ? payload.description : null;
    const contactEmail =
      typeof payload?.contactEmail === "string" ? payload.contactEmail : null;
    const contactPhone =
      typeof payload?.contactPhone === "string" ? payload.contactPhone : null;

    const settings = await updateTenantSettings({
      tenantId: membership.tenantId,
      data: {
        name,
        description,
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Update tenant settings API error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update tenant settings",
      },
      { status: 500 }
    );
  }
}
