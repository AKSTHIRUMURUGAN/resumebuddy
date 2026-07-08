import { NextRequest, NextResponse } from "next/server";

/**
 * Node-runtime route: POST to set session cookie, DELETE to clear it.
 * Called by the client after Firebase auth succeeds.
 */

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// POST /api/auth/session  { idToken }
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

    let uid = "mock-user-123";
    let email = "thirumuruganaks@gmail.com";
    let name = "Thirumurugan";

    if (!isDevMode) {
      // Verify the Firebase ID token server-side (Node runtime — has access to node:crypto)
      const { adminAuth } = await import("@/lib/firebase-admin");
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
      email = decoded.email ?? "";
      name = decoded.name ?? "";
    }

    const response = NextResponse.json({
      success: true,
      user: { uid, email, name },
    });

    // Set secure, httpOnly cookie — never readable by JS
    response.cookies.set("session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 401 }
    );
  }
}

// DELETE /api/auth/session — logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
