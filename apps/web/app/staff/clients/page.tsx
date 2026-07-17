"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type StaffProfilesResponse } from "@/lib/api";
import { claimStageLabels } from "@/lib/claim-stages";
import type { ClaimStage } from "@vsn/types";

export default function AdminClientsPage() {
  const [profiles, setProfiles] = useState<StaffProfilesResponse["profiles"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<StaffProfilesResponse>("/v1/profiles")
      .then((data) => setProfiles(data.profiles))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load clients"));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Client Profiles</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/staff/clients/${profile.id}`} className="hover:underline">
                      {profile.firstName} {profile.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{profile.email}</td>
                  <td className="px-4 py-3">{claimStageLabels[profile.currentStage as ClaimStage]}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(profile.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!profiles.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No client profiles yet.
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
