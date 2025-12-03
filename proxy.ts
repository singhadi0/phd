import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/healthz",
  "/api/health",
]);

const PUBLIC_FILE = /\.(.*)$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/static/") ||
    PUBLIC_FILE.test(pathname) ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(loginUrl);
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];

  if (firstSegment && !["api", "public"].includes(firstSegment)) {
    const memberships =
      (token.memberships as Array<{ tenantSlug: string }> | undefined) ?? [];
    const hasTenantAccess = memberships.some(
      (membership) => membership.tenantSlug === firstSegment
    );

    if (!hasTenantAccess) {
      const unauthorizedUrl = new URL("/login", request.url);
      unauthorizedUrl.searchParams.set("error", "tenant");
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"],
};
