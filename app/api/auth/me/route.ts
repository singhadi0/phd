import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireSession();

    return NextResponse.json({
      user: session.user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}
