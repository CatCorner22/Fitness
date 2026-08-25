import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authSecretBytes } from "@/lib/auth-secret";

const PUBLIC = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC.some((p) => pathname === p)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("garanimal_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    await jwtVerify(token, authSecretBytes(), { algorithms: ["HS256"] });
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  // Instructor stills/audio/video stay authenticated. Only skip Next internals and static chrome.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|woff2?)$).*)"],
};
