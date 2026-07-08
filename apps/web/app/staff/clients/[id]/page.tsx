"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminNav, ClaimTracker } from "@/components/PortalShell";
import { apiFetch, type DocumentsResponse, type PortalProfileResponse } from "@/lib/api";
import { claimStageLabels } from "@/lib/mock-data";
import type { ClaimStage } from "@vsn/types";

const STAGES = Object.keys(claimStageLabels) as ClaimStage[];

export default function StaffClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PortalProfileResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentsResponse["documents"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingStage, setSavingStage] = useState(false);

  async function loadProfile() {
    const [profileResponse, documentsResponse] = await Promise.all([
      apiFetch<PortalProfileResponse>(`/v1/profiles/${params.id}`),
      apiFetch<DocumentsResponse>(`/v1/profiles/${params.id}/documents`)
    ]);
    setData(profileResponse);
    setDocuments(documentsResponse.documents);
  }

  useEffect(() => {
    loadProfile().catch((err) => setError(err instanceof Error ? err.message : "Failed to load client"));
  }, [params.id]);

  async function updateStage(stage: ClaimStage) {
    setSavingStage(true);
    setError(null);
    try {
      await apiFetch(`/v1/profiles/${params.id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage })
      });
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setSavingStage(false);
    }
  }

  const profile = data?.profile;
  const stage = (profile?.currentStage ?? "intake_received") as ClaimStage;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <Link href="/staff/clients" className="text-sm text-slate-500 hover:text-slate-800">
          ← All clients
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--navy-900)]">
          {profile ? `${profile.firstName} ${profile.lastName}` : "Client Profile"}
        </h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="font-bold">Claim Stage</h2>
            <p className="mt-2 text-sm text-slate-600">Current: {claimStageLabels[stage]}</p>
            <select
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={stage}
              disabled={savingStage}
              onChange={(event) => updateStage(event.target.value as ClaimStage)}
            >
              {STAGES.map((item) => (
                <option key={item} value={item}>
                  {claimStageLabels[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="card">
            <h2 className="font-bold">Documents</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {documents.map((doc) => (
                <li key={doc.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span>{doc.title}</span>
                  <span className="capitalize text-slate-500">{doc.status.replace(/_/g, " ")}</span>
                </li>
              ))}
              {!documents.length && <li className="text-slate-500">No documents uploaded.</li>}
            </ul>
          </div>
        </div>

        <div className="card mt-6">
          <h2 className="font-bold">Timeline</h2>
          <ul className="mt-4 space-y-3">
            {(data?.timeline ?? []).slice().reverse().map((item) => (
              <li key={item.id} className="border-b border-slate-100 pb-2 text-sm">
                <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
                <div>{item.summary}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card mt-6 max-w-lg">
          <ClaimTracker currentStage={stage} />
        </div>
      </main>
    </div>
  );
}
