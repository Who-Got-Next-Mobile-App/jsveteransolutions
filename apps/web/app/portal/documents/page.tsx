"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalNav } from "@/components/PortalShell";
import { apiFetch, type DocumentsResponse } from "@/lib/api";

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentsResponse["documents"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    try {
      const data = await apiFetch<DocumentsResponse>("/v1/documents");
      setDocuments(data.documents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const presign = await apiFetch<{ record: { id: string }; uploadUrl: string }>("/v1/documents/presign", {
        method: "POST",
        body: JSON.stringify({
          type: "other",
          title: file.name,
          mimeType: file.type || "application/pdf",
          sizeBytes: file.size,
          originalFilename: file.name
        })
      });

      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file
      });

      await apiFetch(`/v1/documents/${presign.record.id}/complete`, { method: "POST", body: "{}" });
      form.reset();
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">My Documents</h1>
        <p className="mt-2 text-slate-600">Secure upload via presigned storage flow.</p>

        <form onSubmit={handleUpload} className="card mt-6 max-w-xl space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Upload file (PDF, JPG, PNG, DOCX)</label>
            <input name="file" type="file" required className="mt-1 block w-full text-sm" />
          </div>
          <button type="submit" disabled={uploading} className="btn-primary">
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 capitalize">{doc.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!documents.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No documents yet.
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
