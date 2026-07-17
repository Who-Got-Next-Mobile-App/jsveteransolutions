"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { COMPANY_NAME } from "@/lib/brand";
import { isCognitoConfigured, startCognitoSignup } from "@/lib/auth/cognito";
import { savePendingInviteToken } from "@/lib/auth/storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface InvitePreview {
  emailMasked: string;
  status: string;
  expiresAt: string;
  valid: boolean;
}

function InviteContent() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/v1/invites/${params.token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Invite not found or expired");
        const data = (await response.json()) as { invite: InvitePreview };
        setInvite(data.invite);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load invite"))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function acceptInvite() {
    if (!isCognitoConfigured()) {
      setError("Cognito is not configured");
      return;
    }
    savePendingInviteToken(params.token);
    try {
      await startCognitoSignup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start signup");
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading invite...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="card w-full max-w-lg text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{COMPANY_NAME}</div>
        <h1 className="mt-2 text-2xl font-bold text-[var(--navy-900)]">Provider Invite</h1>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {invite && (
          <>
            <p className="mt-3 text-slate-600">
              You were invited as a provider for {invite.emailMasked}.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Status: {invite.status}
              {invite.valid ? ` · Expires ${new Date(invite.expiresAt).toLocaleString()}` : ""}
            </p>
            {invite.valid ? (
              <button type="button" className="btn-primary mt-6" onClick={acceptInvite}>
                Create provider account
              </button>
            ) : (
              <p className="mt-6 text-sm text-amber-700">This invite is no longer valid.</p>
            )}
          </>
        )}
        <button type="button" className="mt-4 text-sm text-slate-500 hover:text-slate-800" onClick={() => router.push("/login?portal=staff")}>
          Already have an account? Sign in
        </button>
        <div className="mt-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProviderInvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <InviteContent />
    </Suspense>
  );
}
