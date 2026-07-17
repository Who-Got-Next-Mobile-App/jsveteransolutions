"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type StaffProfilesResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { claimStageLabels } from "@/lib/claim-stages";
import type { ClaimStage } from "@vsn/types";

type Tab = "caseload" | "unassigned";

export default function AdminClientsPage() {
  const { session } = useAuth();
  const isOwner = session?.role === "owner";
  const [tab, setTab] = useState<Tab>("caseload");
  const [profiles, setProfiles] = useState<StaffProfilesResponse["profiles"]>([]);
  const [unassigned, setUnassigned] = useState<StaffProfilesResponse["profiles"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  async function load() {
    const [mineResponse, unassignedResponse] = await Promise.all([
      apiFetch<StaffProfilesResponse>("/v1/profiles"),
      apiFetch<StaffProfilesResponse>("/v1/staff/clients/unassigned")
    ]);
    setProfiles(mineResponse.profiles);
    setUnassigned(unassignedResponse.profiles);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load clients"));
  }, []);

  async function claim(id: string) {
    setClaimingId(id);
    setError(null);
    try {
      await apiFetch(`/v1/staff/clients/${id}/claim`, { method: "POST", body: "{}" });
      await load();
      setTab("caseload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim client");
    } finally {
      setClaimingId(null);
    }
  }

  const rows = tab === "unassigned" ? unassigned : profiles;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Clients</h1>
        <p className="mt-2 text-slate-600">
          {isOwner ? "All clients and the unassigned pool." : "Your caseload and unassigned veterans you can claim."}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("caseload")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "caseload" ? "bg-[var(--navy-900)] text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {isOwner ? "All clients" : "My clients"} ({profiles.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("unassigned")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "unassigned" ? "bg-[var(--navy-900)] text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            Unassigned ({unassigned.length})
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Updated</th>
                {tab === "unassigned" && <th className="px-4 py-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((profile) => (
                <tr key={profile.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/staff/clients/${profile.id}`} className="hover:underline">
                      {profile.firstName} {profile.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{profile.email}</td>
                  <td className="px-4 py-3">{claimStageLabels[profile.currentStage as ClaimStage]}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(profile.updatedAt).toLocaleDateString()}</td>
                  {tab === "unassigned" && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={claimingId === profile.id}
                        onClick={() => claim(profile.id)}
                      >
                        {claimingId === profile.id ? "Claiming..." : "Claim"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={tab === "unassigned" ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                    No clients in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
