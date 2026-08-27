import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authSecretBytes } from "@/lib/auth-secret";
import { publicOriginFromHeaders } from "@/lib/runtime";

// The manifest must be public: browsers fetch it during PWA install checks,
// sometimes without cookies, and it contains only the app name and colors.
const PUBLIC = ["/login", "/api/health", "/manifest.webmanifest"];

function publicUrl(request: NextRequest, pathname: string): URL {
  return new URL(
    pathname,
    publicOriginFromHeaders({
      requestUrl: request.url,
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    }),
  );
}

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
    return NextResponse.redirect(publicUrl(request, "/login"));
  }
  try {
    await jwtVerify(token, authSecretBytes(), { algorithms: ["HS256"] });
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(publicUrl(request, "/login"));
  }
}

export const config = {
  // Instructor stills/audio/video stay authenticated. Only skip Next internals and static chrome.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|woff2?)$).*)"],
};
