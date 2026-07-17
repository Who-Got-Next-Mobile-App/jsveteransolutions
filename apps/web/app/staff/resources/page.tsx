"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import {
  apiFetch,
  type CatalogResourcesResponse,
  type StaffProfilesResponse
} from "@/lib/api";

export default function StaffResourcesPage() {
  const [resources, setResources] = useState<CatalogResourcesResponse["resources"]>([]);
  const [clients, setClients] = useState<StaffProfilesResponse["profiles"]>([]);
  const [clientProfileId, setClientProfileId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("article");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [resourceResponse, clientResponse] = await Promise.all([
      apiFetch<CatalogResourcesResponse>("/v1/staff/resources"),
      apiFetch<StaffProfilesResponse>("/v1/profiles")
    ]);
    setResources(resourceResponse.resources);
    setClients(clientResponse.profiles);
    if (!resourceId && resourceResponse.resources[0]) setResourceId(resourceResponse.resources[0].id);
    if (!clientProfileId && clientResponse.profiles[0]) setClientProfileId(clientResponse.profiles[0].id);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load resources"));
  }, []);

  async function createResource(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch("/v1/staff/resources", {
        method: "POST",
        body: JSON.stringify({
          slug,
          title,
          type,
          description,
          category: "general"
        })
      });
      setSlug("");
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resource");
    }
  }

  async function assignResource(event: FormEvent) {
    event.preventDefault();
    if (!clientProfileId || !resourceId) return;
    try {
      await apiFetch(`/v1/staff/clients/${clientProfileId}/resources`, {
        method: "POST",
        body: JSON.stringify({ resourceId })
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign resource");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Resources</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form onSubmit={createResource} className="card space-y-3">
            <h2 className="font-semibold">Add catalog resource</h2>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="article">Article</option>
              <option value="checklist">Checklist</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="template">Template</option>
            </select>
            <textarea
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <button type="submit" className="btn-primary">
              Create
            </button>
          </form>

          <form onSubmit={assignResource} className="card space-y-3">
            <h2 className="font-semibold">Assign to client</h2>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={clientProfileId}
              onChange={(event) => setClientProfileId(event.target.value)}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
            >
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Assign
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {resources.map((resource) => (
            <div key={resource.id} className="card">
              <div className="text-xs uppercase text-slate-400">{resource.type}</div>
              <div className="font-medium">{resource.title}</div>
              <p className="mt-1 text-sm text-slate-600">{resource.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
