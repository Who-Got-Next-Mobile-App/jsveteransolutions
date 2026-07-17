"use client";

import { useEffect, useState } from "react";
import { ClaimTracker, PortalNav } from "@/components/PortalShell";
import { apiFetch, type PortalProfileResponse } from "@/lib/api";
import { claimStageLabels } from "@/lib/claim-stages";
import type { ClaimStage } from "@vsn/types";

export default function PortalClaimPage() {
  const [data, setData] = useState<PortalProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PortalProfileResponse>("/v1/profiles/me")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load claim status"));
  }, []);

  const stage = (data?.profile.currentStage ?? "intake_received") as ClaimStage;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Claim Status</h1>
        <p className="mt-2 text-slate-600">Package-tracking style progress — not a legal case file.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="card mt-6 max-w-md">
          <div className="text-sm text-slate-500">Current stage</div>
          <div className="text-xl font-bold text-[var(--navy-900)]">{claimStageLabels[stage]}</div>
        </div>
        <div className="mt-8 max-w-lg">
          <ClaimTracker currentStage={stage} />
        </div>
      </main>
    </div>
  );
}
