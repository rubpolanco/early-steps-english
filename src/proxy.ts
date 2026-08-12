import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const STAFF_PREFIXES = [
  "/dashboard",
  "/checkin",
  "/students",
  "/classrooms",
  "/staff",
  "/reports",
  "/messages",
  "/photos",
  "/billing",
  "/enrollment",
];

const PARENT_PREFIX = "/parent";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isStaffRoute = STAFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isParentRoute =
    pathname === PARENT_PREFIX || pathname.startsWith(PARENT_PREFIX + "/");

  if (!session) {
    if (pathname === "/") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isStaffRoute && session.role === "parent") {
    const url = req.nextUrl.clone();
    url.pathname = "/parent";
    return NextResponse.redirect(url);
  }

  if (isParentRoute && session.role !== "parent") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|brand|favicon.ico).*)",
  ],
};
