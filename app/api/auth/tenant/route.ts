import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import {
  requireSession,
  requireMembership,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/session";

const bodySchema = z
  .object({
    tenantId: z.string().cuid().optional(),
    tenantSlug: z.string().min(1).optional(),
  })
  .refine((value) => value.tenantId || value.tenantSlug, {
    message: "tenantId or tenantSlug is required",
  });

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const membership = requireMembership(session, parsed.data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeTenantId: membership.tenantId } as Record<string, unknown>,
    });

    return NextResponse.json({
      activeTenantId: membership.tenantId,
      tenantSlug: membership.tenantSlug,
      requiresSessionRefresh: true,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
