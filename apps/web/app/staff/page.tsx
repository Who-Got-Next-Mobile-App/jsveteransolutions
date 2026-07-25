"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminNav, StatCard } from "@/components/PortalShell";
import { apiFetch, type DocumentsResponse, type StaffStatsResponse } from "@/lib/api";
import { formatProfileName } from "@/lib/person-name";

function clientDisplayName(raw?: string | null) {
  if (!raw?.trim()) return "Unknown client";
  const parts = raw.trim().split(/\s+/);
  return formatProfileName(parts[0] ?? "", parts.slice(1).join(" "));
}

function groupDocumentsByClient(documents: DocumentsResponse["documents"]) {
  const groups = new Map<string, { clientKey: string; clientName: string; docs: DocumentsResponse["documents"] }>();

  for (const doc of documents) {
    const clientKey = doc.clientProfileId ?? doc.clientName ?? "unknown";
    const existing = groups.get(clientKey);
    if (existing) {
      existing.docs.push(doc);
    } else {
      groups.set(clientKey, {
        clientKey,
        clientName: clientDisplayName(doc.clientName),
        docs: [doc]
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StaffStatsResponse["stats"] | null>(null);
  const [documents, setDocuments] = useState<DocumentsResponse["documents"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<StaffStatsResponse>("/v1/staff/stats"),
      apiFetch<DocumentsResponse>("/v1/staff/documents")
    ])
      .then(([statsResponse, documentsResponse]) => {
        setStats(statsResponse.stats);
        setDocuments(documentsResponse.documents);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  const documentsByClient = useMemo(() => groupDocumentsByClient(documents), [documents]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Provider Dashboard</h1>
        <p className="text-slate-600">Your caseload and operations overview.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="My Open Clients" value={String(stats?.activeClients ?? "—")} />
          <StatCard label="Unassigned" value={String(stats?.unassignedClients ?? "—")} />
          <StatCard
            label="Documents to Review"
            value={String(stats?.documentsToReview ?? "—")}
            sub={stats?.urgentDocuments ? `${stats.urgentDocuments} urgent` : undefined}
          />
          <StatCard label="Open Tasks" value={String(stats?.openTasks ?? "—")} />
        </div>

        <div className="mt-8 card">
          <h2 className="font-bold">Document Review Queue</h2>
          <p className="mt-1 text-sm text-slate-500">Grouped by client</p>
          <div className="mt-4 space-y-4">
            {documentsByClient.slice(0, 6).map((group) => (
              <div key={group.clientKey} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--navy-900)]">{group.clientName}</h3>
                  <span className="text-xs text-slate-400">
                    {group.docs.length} document{group.docs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {group.docs.slice(0, 3).map((doc) => (
                    <li key={doc.id} className="flex justify-between gap-3">
                      <span className="text-slate-700">{doc.title}</span>
                      <span className="shrink-0 capitalize text-amber-600">{doc.status.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                  {group.docs.length > 3 && (
                    <li className="text-xs text-slate-400">+{group.docs.length - 3} more</li>
                  )}
                </ul>
              </div>
            ))}
            {!documentsByClient.length && (
              <p className="text-sm text-slate-500">No documents in the review queue.</p>
            )}
          </div>
          <Link href="/staff/documents" className="mt-4 inline-block text-sm font-medium text-[var(--navy-800)] hover:underline">
            Open document queue →
          </Link>
        </div>
      </main>
    </div>
  );
}
