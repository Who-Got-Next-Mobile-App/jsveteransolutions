"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav, StatCard } from "@/components/PortalShell";
import { apiFetch, type DocumentsResponse, type StaffProfilesResponse, type StaffStatsResponse } from "@/lib/api";
import { claimStageLabels } from "@/lib/mock-data";
import type { ClaimStage } from "@vsn/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<StaffStatsResponse["stats"] | null>(null);
  const [profiles, setProfiles] = useState<StaffProfilesResponse["profiles"]>([]);
  const [documents, setDocuments] = useState<DocumentsResponse["documents"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<StaffStatsResponse>("/v1/staff/stats"),
      apiFetch<StaffProfilesResponse>("/v1/profiles"),
      apiFetch<DocumentsResponse>("/v1/staff/documents")
    ])
      .then(([statsResponse, profilesResponse, documentsResponse]) => {
        setStats(statsResponse.stats);
        setProfiles(profilesResponse.profiles);
        setDocuments(documentsResponse.documents);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  const featuredClient = profiles[0];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Operations Dashboard</h1>
        <p className="text-slate-600">Owner and assistant view — live data from the JSVS API.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Active Clients" value={String(stats?.activeClients ?? "—")} />
          <StatCard
            label="Documents to Review"
            value={String(stats?.documentsToReview ?? "—")}
            sub={stats?.urgentDocuments ? `${stats.urgentDocuments} urgent` : undefined}
          />
          <StatCard label="Open Tasks" value="—" sub="Coming soon" />
          <StatCard label="Revenue (MTD)" value="—" sub="Stripe coming soon" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="font-bold">Featured Client</h2>
            {featuredClient ? (
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span> {featuredClient.firstName} {featuredClient.lastName}
                </div>
                <div>
                  <span className="text-slate-500">Email:</span> {featuredClient.email}
                </div>
                <div>
                  <span className="text-slate-500">Stage:</span>{" "}
                  {claimStageLabels[featuredClient.currentStage as ClaimStage]}
                </div>
                <Link href={`/staff/clients/${featuredClient.id}`} className="inline-block text-sm font-medium text-[var(--navy-800)] hover:underline">
                  View profile →
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No client profiles yet. Sign in as a demo client and upload a document.</p>
            )}
          </div>
          <div className="card">
            <h2 className="font-bold">Document Review Queue</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {documents.slice(0, 5).map((doc) => (
                <li key={doc.id} className="flex justify-between border-b border-slate-100 pb-2">
                  <span>
                    {doc.title}
                    {doc.clientName ? ` · ${doc.clientName}` : ""}
                  </span>
                  <span className="capitalize text-amber-600">{doc.status.replace(/_/g, " ")}</span>
                </li>
              ))}
              {!documents.length && <li className="text-slate-500">No documents in the review queue.</li>}
            </ul>
            <Link href="/staff/documents" className="mt-4 inline-block text-sm font-medium text-[var(--navy-800)] hover:underline">
              Open document queue →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
