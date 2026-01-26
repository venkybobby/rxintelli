import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/verification", "/entry", "/adjudication", "/control-tower"];
const CONTROL_TOWER_ONLY_ROLES = ["admin", "rph"];
const secret = process.env.NEXTAUTH_SECRET ?? "rxintelli-demo-secret";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret });
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (pathname === "/control-tower" || pathname.startsWith("/control-tower/")) {
    const role = token.role as string | undefined;
    if (!role || !CONTROL_TOWER_ONLY_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/verification",
    "/verification/:path*",
    "/entry",
    "/entry/:path*",
    "/adjudication",
    "/adjudication/:path*",
    "/control-tower",
    "/control-tower/:path*",
  ],
};
