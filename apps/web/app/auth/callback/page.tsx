"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { portalHomeForRole } from "@/lib/auth/AuthProvider";
import { completeCognitoLogin, consumeLoginPortal } from "@/lib/auth/cognito";
import { clearPendingInviteToken, clearSession, loadPendingInviteToken, saveSession } from "@/lib/auth/storage";
import { setApiSession } from "@/lib/auth/api-session";
import { apiFetch } from "@/lib/api";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Completing secure sign-in...");
  const started = useRef(false);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (oauthError) {
      setError(oauthErrorDescription?.replace(/\+/g, " ") || oauthError);
      return;
    }

    if (!code) {
      setError("Missing authorization code. Start again from Sign in.");
      return;
    }

    const intendedPortal = consumeLoginPortal();

    completeCognitoLogin(code)
      .then(async (session) => {
        saveSession(session);
        setApiSession(session);
        try {
          await apiFetch("/v1/session/bootstrap", { method: "POST", body: "{}" });
        } catch (err) {
          throw new Error(
            err instanceof Error
              ? `Signed in, but portal setup failed: ${err.message}`
              : "Signed in, but portal setup failed"
          );
        }

        const inviteToken = loadPendingInviteToken();
        if (inviteToken) {
          setMessage("Activating provider access...");
          try {
            await apiFetch(`/v1/invites/${inviteToken}/redeem`, { method: "POST", body: "{}" });
            clearPendingInviteToken();
            clearSession();
            setApiSession(null);
            router.replace("/login?portal=staff&upgraded=1");
            return;
          } catch (err) {
            clearPendingInviteToken();
            throw err;
          }
        }

        if (intendedPortal === "staff" && session.role === "client") {
          clearSession();
          setApiSession(null);
          throw new Error(
            "This account is not a provider. Provider access is invite-only — ask an existing provider for an invite link, then sign in."
          );
        }

        router.replace(portalHomeForRole(session.role, intendedPortal ?? undefined));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Authentication failed");
      });
  }, [code, oauthError, oauthErrorDescription, router]);

  if (error) {
    const staffHint = error.toLowerCase().includes("invite");
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold text-[var(--navy-900)]">Sign in failed</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link href={staffHint ? "/login?portal=staff" : "/login"} className="btn-primary mt-4 inline-flex">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      {message}
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
