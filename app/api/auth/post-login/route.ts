import { NextResponse } from "next/server";

import { resolveDefaultDashboardPath } from "@/lib/auth/navigation";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireSession();
    const redirectTo = resolveDefaultDashboardPath(session);

    return NextResponse.json({ redirectTo });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}
