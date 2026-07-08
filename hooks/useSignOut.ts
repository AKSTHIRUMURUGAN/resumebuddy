"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Returns a signOut() function that:
 * 1. Signs out of Firebase client SDK (if not dev mode)
 * 2. Calls DELETE /api/auth/session to clear the httpOnly cookie
 * 3. Redirects to /signin
 */
export function useSignOut() {
  const router = useRouter();

  const signOut = useCallback(async () => {
    try {
      if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
        const { auth } = await import("@/lib/firebase");
        const { signOut: firebaseSignOut } = await import("firebase/auth");
        await firebaseSignOut(auth);
      }
    } catch {
      // Ignore Firebase signout errors — still clear session cookie
    }

    // Clear server-side httpOnly session cookie
    await fetch("/api/auth/session", { method: "DELETE" });

    router.replace("/signin");
  }, [router]);

  return signOut;
}
