import { NextRequest, NextResponse } from "next/server";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

/**
 * Extract the authenticated user from the request headers injected by proxy.ts.
 * Call this at the top of every API route handler.
 *
 * Returns the user or throws a 401 NextResponse.
 */
export function getAuthUser(request: NextRequest): AuthUser {
  const uid = request.headers.get("x-user-id");
  if (!uid) {
    throw createUnauthorized();
  }
  return {
    uid,
    email: request.headers.get("x-user-email") ?? "",
    name: request.headers.get("x-user-name") ?? "",
  };
}

/**
 * Returns a 401 Unauthorized response.
 */
export function createUnauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Wraps an API handler with auth check. Use for cleaner route handlers.
 *
 * @example
 * export const GET = withAuth(async (req, user) => {
 *   const resumes = await Resume.find({ userId: user.uid });
 *   return NextResponse.json({ data: resumes });
 * });
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const uid = request.headers.get("x-user-id");
    if (!uid) {
      return createUnauthorized();
    }
    const user: AuthUser = {
      uid,
      email: request.headers.get("x-user-email") ?? "",
      name: request.headers.get("x-user-name") ?? "",
    };
    return handler(request, user);
  };
}
