"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginRedirectNotice } from "@/components/AuthGuard";
import { COMPANY_NAME } from "@/lib/brand";
import { portalHomeForRole, useAuth } from "@/lib/auth/AuthProvider";
import { isCognitoConfigured, startCognitoLogin, startCognitoSignup } from "@/lib/auth/cognito";
import { DEV_PERSONAS, type PortalKind } from "@/lib/auth/types";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithDevPersona } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const portal = (searchParams.get("portal") as PortalKind | null) ?? "client";
  const nextPath = searchParams.get("next");
  const upgraded = searchParams.get("upgraded") === "1";
  const devAuthEnabled = process.env.NEXT_PUBLIC_DEV_AUTH === "true";
  const cognitoEnabled = isCognitoConfigured();

  const personas = DEV_PERSONAS.filter((persona) =>
    portal === "staff" ? persona.role !== "client" : persona.role === "client"
  );

  async function handleDevLogin(personaId: string) {
    const persona = DEV_PERSONAS.find((item) => item.sub === personaId);
    if (!persona) return;

    setSubmitting(personaId);
    setError(null);

    try {
      const destination = nextPath ?? portalHomeForRole(persona.role, portal);
      await loginWithDevPersona(persona, destination);
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCognitoLogin() {
    setError(null);
    try {
      await startCognitoLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start Cognito login");
    }
  }

  async function handleCognitoSignup() {
    setError(null);
    try {
      await startCognitoSignup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start Cognito signup");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{COMPANY_NAME}</div>
          <h1 className="mt-2 text-3xl font-bold text-[var(--navy-900)]">
            {portal === "staff" ? "Provider Sign In" : "Client Portal Sign In"}
          </h1>
          <p className="mt-2 text-slate-600">
            {portal === "staff"
              ? "Continue with a passkey or email one-time code. No password is required."
              : "Continue with a passkey or email one-time code to access your documents and claim progress. No password is required."}
          </p>
          {upgraded && (
            <p className="mt-2 text-sm text-emerald-700">
              Provider access activated. Sign in again to load your updated permissions.
            </p>
          )}
          <LoginRedirectNotice />
        </div>

        <div className="card space-y-6">
          {cognitoEnabled && (
            <div className="space-y-3">
              <button type="button" onClick={handleCognitoLogin} className="btn-primary w-full">
                Continue with passkey or email code
              </button>
              {portal === "client" && (
                <button type="button" onClick={handleCognitoSignup} className="btn-outline w-full">
                  Create client account
                </button>
              )}
              {portal === "staff" && (
                <p className="text-center text-xs text-slate-500">
                  New providers need an invite link from the team. Ask an existing provider to invite you.
                </p>
              )}
              <p className="mt-2 text-center text-xs text-slate-500">
                Passwordless sign-in via Amazon Cognito — passkey preferred, email code as fallback
              </p>
            </div>
          )}

          {devAuthEnabled && (
            <div className="space-y-3">
              {cognitoEnabled && (
                <div className="text-center text-xs uppercase tracking-wide text-slate-400">or use local dev login</div>
              )}
              {personas.map((persona) => (
                <button
                  key={persona.sub}
                  type="button"
                  disabled={Boolean(submitting)}
                  onClick={() => handleDevLogin(persona.sub)}
                  className="flex w-full items-start justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-[var(--gold-500)] hover:bg-amber-50/40 disabled:opacity-60"
                >
                  <div>
                    <div className="font-semibold text-[var(--navy-900)]">{persona.label}</div>
                    <div className="text-sm text-slate-600">{persona.description}</div>
                  </div>
                  <span className="text-xs font-medium uppercase text-slate-400">
                    {submitting === persona.sub ? "..." : persona.role}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!cognitoEnabled && !devAuthEnabled && (
            <p className="text-sm text-slate-600">
              Authentication is not configured yet. Set Cognito env vars or enable local dev auth.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-center gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            Back to public site
          </Link>
          {portal === "staff" ? (
            <Link href="/login?portal=client" className="hover:text-slate-800">
              Client Portal
            </Link>
          ) : (
            <Link href="/login?portal=staff" className="hover:text-slate-800">
              Provider Portal
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
