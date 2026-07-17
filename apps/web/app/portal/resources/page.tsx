"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PortalNav } from "@/components/PortalShell";
import { apiFetch, type AssignedResourcesResponse } from "@/lib/api";

export default function PortalResourcesPage() {
  const [resources, setResources] = useState<AssignedResourcesResponse["resources"]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await apiFetch<AssignedResourcesResponse>("/v1/resources");
    setResources(data.resources);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load resources"));
  }, []);

  async function updateStatus(id: string, status: "started" | "completed") {
    setError(null);
    try {
      await apiFetch(`/v1/resources/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update resource");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Assigned Resources</h1>
        <p className="mt-2 text-slate-600">Education and downloads assigned to you after consultation.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {resources.map((item) => (
            <div key={item.id} className="card">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {item.resource.type} · {item.resource.category}
              </div>
              <h2 className="mt-1 font-semibold text-[var(--navy-900)]">{item.resource.title}</h2>
              {item.resource.description && <p className="mt-2 text-sm text-slate-600">{item.resource.description}</p>}
              <p className="mt-2 text-xs text-slate-400">
                Status: {item.status}
                {item.resource.estimatedMinutes ? ` · ~${item.resource.estimatedMinutes} min` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.resource.downloadableAssetUrl && (
                  <a href={item.resource.downloadableAssetUrl} target="_blank" rel="noreferrer" className="btn-outline text-xs">
                    Open resource
                  </a>
                )}
                {item.status === "assigned" && (
                  <button type="button" className="btn-primary text-xs" onClick={() => updateStatus(item.id, "started")}>
                    Mark started
                  </button>
                )}
                {item.status !== "completed" && (
                  <button type="button" className="btn-outline text-xs" onClick={() => updateStatus(item.id, "completed")}>
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          ))}
          {!resources.length && !error && (
            <div className="md:col-span-2">
              <EmptyState
                title="No resources assigned yet"
                description="After your consultation, your care team can assign articles, checklists, and downloads here."
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
