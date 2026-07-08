"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { portalHomeForRole } from "@/lib/auth/AuthProvider";
import { completeCognitoLogin } from "@/lib/auth/cognito";
import { saveSession } from "@/lib/auth/storage";
import { setApiSession } from "@/lib/auth/api-session";
import { apiFetch } from "@/lib/api";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Missing authorization code.");
      return;
    }

    completeCognitoLogin(code)
      .then(async (session) => {
        saveSession(session);
        setApiSession(session);
        await apiFetch("/v1/session/bootstrap", { method: "POST", body: "{}" });
        router.replace(portalHomeForRole(session.role));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Authentication failed");
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold text-[var(--navy-900)]">Sign in failed</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link href="/login" className="btn-primary mt-4 inline-flex">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      Completing secure sign-in...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
