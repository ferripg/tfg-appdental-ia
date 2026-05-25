import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require an authenticated session. Add new private prefixes
// here as new modules ship. When we reach 5+ prefixes, refactor to a
// catch-all matcher that excludes public assets and the /api/auth route.
const PRIVATE_PREFIXES = ["/dashboard", "/proveidors", "/tipus-despesa"];

function isPrivate(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { pathname } = request.nextUrl;
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!session && isPrivate(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/proveidors/:path*",
    "/tipus-despesa/:path*",
  ],
};
