import { NextRequest, NextResponse } from "next/server";

import { RoleKey } from "@prisma/client";

import { getDashboardNavigation } from "@/lib/navigation/dashboard";
import {
  ForbiddenError,
  UnauthorizedError,
  requireMembership,
  requireSession,
} from "@/lib/auth/session";

const roleKeyLookup = new Set<string>(Object.values(RoleKey));

function parseRoleKey(value: string | null): RoleKey | undefined {
  if (!value || !roleKeyLookup.has(value)) {
    return undefined;
  }
  return value as RoleKey;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const roleKey = parseRoleKey(
      new URL(_request.url).searchParams.get("role")
    );
    const session = await requireSession();
    const membership = requireMembership(session, {
      tenantSlug,
      roleKey,
    });

    const navigation = await getDashboardNavigation({
      tenantId: membership.tenantId,
      tenantSlug: membership.tenantSlug,
      membershipId: membership.membershipId,
      roleKey: membership.roleKey,
    });

    return NextResponse.json(navigation);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Dashboard navigation API error", error);
    return NextResponse.json(
      { error: "Unable to load dashboard navigation" },
      { status: 500 }
    );
  }
}
