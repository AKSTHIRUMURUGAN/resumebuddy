"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  Sparkles, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
} from "lucide-react";

// Google and GitHub SVG icons
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

async function exchangeTokenForSession(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create session");
  }
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  // In dev mode pre-fill for convenience
  useEffect(() => {
    if (isDevMode) {
      setEmail("thirumuruganaks@gmail.com");
      setPassword("password123");
    }
  }, [isDevMode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isDevMode) {
        // Dev: exchange mock token for server-set httpOnly cookie
        await exchangeTokenForSession("mock-token-dev");
        router.replace(callbackUrl);
        return;
      }

      const { auth } = await import("@/lib/firebase");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      await exchangeTokenForSession(idToken);
      router.replace(callbackUrl);
    } catch (err: any) {
      const msg = err.message || "Failed to sign in";
      setError(
        msg.includes("wrong-password") || msg.includes("user-not-found")
          ? "Invalid email or password"
          : msg.includes("too-many-requests")
          ? "Too many attempts. Try again later."
          : msg
      );
      setLoading(false);
    }
  };

  const handleOAuth = async (providerName: "google" | "github") => {
    setOauthLoading(providerName);
    setError("");
    try {
      const { auth } = await import("@/lib/firebase");
      const { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } =
        await import("firebase/auth");
      const provider =
        providerName === "google"
          ? (() => {
              const p = new GoogleAuthProvider();
              p.setCustomParameters({ prompt: "select_account" });
              return p;
            })()
          : new GithubAuthProvider();

      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      await exchangeTokenForSession(idToken);
      router.replace(callbackUrl);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setOauthLoading(null);
        return;
      }
      if (isDevMode) {
        await exchangeTokenForSession("mock-token-dev");
        router.replace(callbackUrl);
        return;
      }
      setError(err.message || "OAuth authentication failed");
      setOauthLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-6 relative font-sans">
      {/* Background blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-violet-500/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col gap-6 max-w-sm w-full relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to continue to Resume Buddy
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col gap-5">
          {/* Dev mode badge */}
          {isDevMode && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold px-4 py-2.5 rounded-xl text-center tracking-wide">
              🛠 Dev Mode — any credentials work
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl leading-relaxed">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!loading || !!oauthLoading}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-700/60 rounded-xl py-2.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              disabled={!!loading || !!oauthLoading}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-700/60 rounded-xl py-2.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {oauthLoading === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full absolute" />
            <span className="bg-slate-900/60 px-3 text-[10px] font-semibold text-slate-500 uppercase z-10 tracking-widest">
              or email
            </span>
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  autoComplete="email"
                  required
                  className="bg-slate-950 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-full transition-all"
                />
                <Mail className="h-3.5 w-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="bg-slate-950 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-full transition-all"
                />
                <Lock className="h-3.5 w-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!oauthLoading}
              className="mt-1 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-600 text-center">
          Don&apos;t have an account?{" "}
          <NextLink href="/signup" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
            Create one free
          </NextLink>
        </p>
      </div>
    </div>
  );
}
