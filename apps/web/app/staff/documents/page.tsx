"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type DocumentsResponse } from "@/lib/api";
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

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentsResponse["documents"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadDocuments() {
    const data = await apiFetch<DocumentsResponse>("/v1/staff/documents");
    setDocuments(data.documents);
  }

  useEffect(() => {
    loadDocuments().catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"));
  }, []);

  const documentsByClient = useMemo(() => groupDocumentsByClient(documents), [documents]);

  async function updateStatus(documentId: string, status: string) {
    setUpdatingId(documentId);
    setError(null);
    try {
      await apiFetch(`/v1/staff/documents/${documentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setUpdatingId(null);
    }
  }

  async function downloadDocument(documentId: string) {
    try {
      const result = await apiFetch<{ downloadUrl: string }>(`/v1/staff/documents/${documentId}/download`);
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Document Review Queue</h1>
        <p className="mt-1 text-sm text-slate-500">Documents grouped by client</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-6">
          {documentsByClient.map((group) => (
            <section key={group.clientKey} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group.clientName}
                <span className="ml-2 font-normal normal-case text-slate-400">
                  ({group.docs.length})
                </span>
              </h2>
              {group.docs.map((doc) => (
                <div key={doc.id} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-sm text-slate-500">
                      {doc.type.replace(/_/g, " ")} · {new Date(doc.createdAt).toLocaleDateString()} ·{" "}
                      <span className="capitalize">{doc.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => downloadDocument(doc.id)} className="btn-outline text-xs">
                      Download
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === doc.id}
                      onClick={() => updateStatus(doc.id, "additional_info_requested")}
                      className="btn-outline text-xs"
                    >
                      Request more
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === doc.id}
                      onClick={() => updateStatus(doc.id, "complete")}
                      className="btn-primary text-xs"
                    >
                      Mark complete
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ))}
          {!documentsByClient.length && <div className="card text-sm text-slate-500">No documents waiting for review.</div>}
        </div>
      </main>
    </div>
  );
}
