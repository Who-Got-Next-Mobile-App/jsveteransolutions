"use client";

import { useEffect, useState } from "react";
import { ClaimTracker, PortalNav, StatCard } from "@/components/PortalShell";
import { claimStageLabels } from "@/lib/mock-data";
import { apiFetch, type PortalProfileResponse } from "@/lib/api";
import type { ClaimStage } from "@vsn/types";

export default function PortalDashboard() {
  const [data, setData] = useState<PortalProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PortalProfileResponse>("/v1/profiles/me")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
  }, []);

  const profile = data?.profile;
  const stage = (profile?.currentStage ?? "intake_received") as ClaimStage;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--navy-900)]">
            Welcome back{profile ? `, ${profile.firstName} ${profile.lastName}` : ""}
          </h1>
          <p className="text-slate-600">Live data from the JSVS API.</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Current Stage" value={claimStageLabels[stage]} />
          <StatCard label="Timeline Events" value={String(data?.timeline.length ?? 0)} />
          <StatCard label="API Status" value={error ? "Offline" : "Connected"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="font-bold text-[var(--navy-900)]">Claim Progress</h2>
            <div className="mt-4">
              <ClaimTracker currentStage={stage} />
            </div>
          </div>
          <div className="card">
            <h2 className="font-bold text-[var(--navy-900)]">Recent Activity</h2>
            <ul className="mt-4 space-y-3">
              {(data?.timeline ?? []).slice(-5).reverse().map((item) => (
                <li key={item.id} className="border-b border-slate-100 pb-2 text-sm">
                  <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
                  <div className="mt-0.5">{item.summary}</div>
                </li>
              ))}
              {!data?.timeline.length && !error && <li className="text-sm text-slate-500">Loading activity...</li>}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
