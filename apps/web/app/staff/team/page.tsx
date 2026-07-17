"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type ProviderInvitesResponse, type StaffMeResponse } from "@/lib/api";

export default function StaffTeamPage() {
  const [invites, setInvites] = useState<ProviderInvitesResponse["invites"]>([]);
  const [me, setMe] = useState<StaffMeResponse["user"] | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    const [inviteResponse, meResponse] = await Promise.all([
      apiFetch<ProviderInvitesResponse>("/v1/staff/invites"),
      apiFetch<StaffMeResponse>("/v1/staff/me")
    ]);
    setInvites(inviteResponse.invites);
    setMe(meResponse.user);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load team"));
  }, []);

  async function createInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/staff/invites", { method: "POST", body: JSON.stringify({ email }) });
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    }
  }

  async function revokeInvite(id: string) {
    try {
      await apiFetch(`/v1/staff/invites/${id}/revoke`, { method: "POST", body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  }

  async function toggleAccepting(acceptingClients: boolean) {
    try {
      const response = await apiFetch<StaffMeResponse>("/v1/staff/me/availability", {
        method: "PATCH",
        body: JSON.stringify({ acceptingClients })
      });
      setMe(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update availability");
    }
  }

  function inviteUrl(token: string) {
    if (typeof window === "undefined") return `/invite/${token}`;
    return `${window.location.origin}/invite/${token}`;
  }

  async function copyInvite(token: string, id: string) {
    await navigator.clipboard.writeText(inviteUrl(token));
    setCopiedId(id);
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Provider Team</h1>
        <p className="mt-2 text-slate-600">Invite providers and control whether you accept new auto-assigned clients.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="card mt-6 max-w-xl">
          <h2 className="font-semibold">My availability</h2>
          <p className="mt-1 text-sm text-slate-600">
            When enabled, new clients are auto-assigned to you when you have the least open caseload.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={me?.acceptingClients ?? true}
              onChange={(event) => toggleAccepting(event.target.checked)}
            />
            Accepting new clients
          </label>
        </div>

        <form onSubmit={createInvite} className="card mt-6 max-w-xl space-y-3">
          <h2 className="font-semibold">Invite a provider</h2>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="provider@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="btn-primary">
            Create invite link
          </button>
        </form>

        <div className="mt-8 space-y-3">
          <h2 className="font-semibold">Invites</h2>
          {invites.map((invite) => (
            <div key={invite.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{invite.email}</div>
                <div className="text-xs uppercase text-slate-400">
                  {invite.status} · expires {new Date(invite.expiresAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                {invite.status === "pending" && (
                  <>
                    <button type="button" className="btn-outline text-xs" onClick={() => copyInvite(invite.token, invite.id)}>
                      {copiedId === invite.id ? "Copied" : "Copy link"}
                    </button>
                    <button type="button" className="btn-outline text-xs" onClick={() => revokeInvite(invite.id)}>
                      Revoke
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!invites.length && <p className="text-sm text-slate-500">No invites yet.</p>}
        </div>
      </main>
    </div>
  );
}
