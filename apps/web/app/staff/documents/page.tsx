"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type DocumentsResponse } from "@/lib/api";

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
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">{doc.title}</div>
                <div className="text-sm text-slate-500">
                  {doc.type.replace(/_/g, " ")} · {doc.clientName ?? "Unknown client"} ·{" "}
                  {new Date(doc.createdAt).toLocaleDateString()}
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
          {!documents.length && <div className="card text-sm text-slate-500">No documents waiting for review.</div>}
        </div>
      </main>
    </div>
  );
}
