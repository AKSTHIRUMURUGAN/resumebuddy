import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/** Paths that are always publicly accessible (no auth needed). */
const PUBLIC_PATHS = [
  "/",
  "/signin",
  "/signup",
  "/portfolio",     // public share pages
  "/share",         // public shared resumes
  "/_next",
  "/favicon.ico",
  "/api/auth",      // session create/delete endpoints
  "/api/public",
];

/** API paths — return 401 JSON instead of redirecting to signin. */
const API_PREFIX = "/api/";

function isPublicPath(pathname: string): boolean {
  if (pathname.includes(".")) return true; // static files
  return PUBLIC_PATHS.some((p) =>
    pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p)
  );
}

// ---------------------------------------------------------------------------
// Edge-safe JWT utilities  (no node:crypto — Edge Runtime compatible)
// ---------------------------------------------------------------------------

interface JwtPayload {
  uid?: string;
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT: expected 3 parts");

  // Base64url → base64 → decoded
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  // Pad to multiple of 4
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

function isExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  // Allow 30-second clock skew
  return Date.now() / 1000 > payload.exp + 30;
}

// ---------------------------------------------------------------------------
// Helper to build a response with injected user headers
// ---------------------------------------------------------------------------

function buildAuthedResponse(
  request: NextRequest,
  uid: string,
  email: string,
  name: string
): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-user-id", uid);
  headers.set("x-user-email", email);
  headers.set("x-user-name", name);
  return NextResponse.next({ request: { headers } });
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/signin";
  // Preserve the original destination so we can redirect back after login
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

function unauthorized(message = "Unauthorized — please sign in"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

// ---------------------------------------------------------------------------
// Main proxy handler
// ---------------------------------------------------------------------------

function checkAuthStatus(request: NextRequest): boolean {
  const sessionToken =
    request.cookies.get("session")?.value ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!sessionToken) return false;

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
  if (isDevMode) return true;

  try {
    const payload = decodeJwtPayload(sessionToken);
    return !isExpired(payload);
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 0. Redirect authenticated users away from signin/signup
  if (pathname === "/signin" || pathname === "/signup") {
    if (checkAuthStatus(request)) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // 1. Always allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Dev mode — inject mock user and pass through immediately
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
  if (isDevMode) {
    return buildAuthedResponse(
      request,
      "mock-user-123",
      "thirumuruganaks@gmail.com",
      "Thirumurugan"
    );
  }

  // 3. Read token — prefer httpOnly cookie, fall back to Authorization header
  const sessionToken =
    request.cookies.get("session")?.value ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  // No token at all
  if (!sessionToken) {
    return pathname.startsWith(API_PREFIX)
      ? unauthorized()
      : redirectToSignIn(request);
  }

  // 4. Decode and validate the JWT (Edge-safe — no node:crypto)
  try {
    const payload = decodeJwtPayload(sessionToken);

    // Reject expired tokens
    if (isExpired(payload)) {
      // Clear stale cookie
      const response = pathname.startsWith(API_PREFIX)
        ? unauthorized("Session expired — please sign in again")
        : redirectToSignIn(request);
      response.cookies.set("session", "", { maxAge: 0, path: "/" });
      return response;
    }

    const uid = payload.uid ?? payload.sub ?? "";
    if (!uid) throw new Error("No uid in token");

    return buildAuthedResponse(
      request,
      uid,
      (payload.email as string) ?? "",
      (payload.name as string) ?? ""
    );
  } catch (err) {
    // Malformed / invalid token
    console.error("[proxy] Token decode error:", (err as Error).message);
    const response = pathname.startsWith(API_PREFIX)
      ? unauthorized("Invalid session token")
      : redirectToSignIn(request);
    response.cookies.set("session", "", { maxAge: 0, path: "/" });
    return response;
  }
}

// ---------------------------------------------------------------------------
// Matcher config — scope the proxy only to protected routes
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static (static assets)
     *   - _next/image  (image optimization)
     *   - favicon.ico
     *   - public files (*.png, *.svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
