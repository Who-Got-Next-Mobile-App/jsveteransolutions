"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminNav, ClaimTracker } from "@/components/PortalShell";
import {
  apiFetch,
  type AssignedResourcesResponse,
  type CatalogResourcesResponse,
  type DocumentsResponse,
  type PortalProfileResponse,
  type TasksResponse,
  type ThreadsResponse
} from "@/lib/api";
import { claimStageLabels, claimStages } from "@/lib/claim-stages";
import type { ClaimStage } from "@vsn/types";

const STAGES = claimStages;

export default function StaffClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PortalProfileResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentsResponse["documents"]>([]);
  const [tasks, setTasks] = useState<TasksResponse["tasks"]>([]);
  const [threads, setThreads] = useState<ThreadsResponse["threads"]>([]);
  const [assignedResources, setAssignedResources] = useState<AssignedResourcesResponse["resources"]>([]);
  const [catalog, setCatalog] = useState<CatalogResourcesResponse["resources"]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingStage, setSavingStage] = useState(false);

  async function loadProfile() {
    const [
      profileResponse,
      documentsResponse,
      tasksResponse,
      threadsResponse,
      assignedResponse,
      catalogResponse
    ] = await Promise.all([
      apiFetch<PortalProfileResponse>(`/v1/profiles/${params.id}`),
      apiFetch<DocumentsResponse>(`/v1/profiles/${params.id}/documents`),
      apiFetch<TasksResponse>(`/v1/staff/tasks?clientProfileId=${params.id}`),
      apiFetch<ThreadsResponse>(`/v1/staff/messages?clientProfileId=${params.id}`),
      apiFetch<AssignedResourcesResponse>(`/v1/staff/clients/${params.id}/resources`),
      apiFetch<CatalogResourcesResponse>("/v1/staff/resources")
    ]);
    setData(profileResponse);
    setDocuments(documentsResponse.documents);
    setTasks(tasksResponse.tasks);
    setThreads(threadsResponse.threads);
    setAssignedResources(assignedResponse.resources);
    setCatalog(catalogResponse.resources);
    if (!resourceId && catalogResponse.resources[0]) setResourceId(catalogResponse.resources[0].id);
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

  async function assignTask(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch(`/v1/staff/clients/${params.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: taskTitle, visibility: "client_visible" })
      });
      setTaskTitle("");
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign task");
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch(`/v1/staff/clients/${params.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ subject: messageSubject, body: messageBody })
      });
      setMessageSubject("");
      setMessageBody("");
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  async function assignResource(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch(`/v1/staff/clients/${params.id}/resources`, {
        method: "POST",
        body: JSON.stringify({ resourceId })
      });
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign resource");
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

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <form onSubmit={assignTask} className="card space-y-3">
            <h2 className="font-bold">Assign task</h2>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Task title"
              required
            />
            <button type="submit" className="btn-primary">
              Assign
            </button>
            <ul className="space-y-2 text-sm">
              {tasks.map((task) => (
                <li key={task.id}>
                  {task.title} · {task.status.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          </form>

          <form onSubmit={sendMessage} className="card space-y-3">
            <h2 className="font-bold">Message client</h2>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={messageSubject}
              onChange={(event) => setMessageSubject(event.target.value)}
              placeholder="Subject"
              required
            />
            <textarea
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="Message"
              required
            />
            <button type="submit" className="btn-primary">
              Send
            </button>
            <ul className="space-y-2 text-sm">
              {threads.map((thread) => (
                <li key={thread.id}>{thread.subject}</li>
              ))}
            </ul>
          </form>

          <form onSubmit={assignResource} className="card space-y-3">
            <h2 className="font-bold">Assign resource</h2>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
            >
              {catalog.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Assign
            </button>
            <ul className="space-y-2 text-sm">
              {assignedResources.map((item) => (
                <li key={item.id}>{item.resource.title}</li>
              ))}
            </ul>
          </form>
        </div>

        <div className="card mt-6">
          <h2 className="font-bold">Timeline</h2>
          <ul className="mt-4 space-y-3">
            {(data?.timeline ?? [])
              .slice()
              .reverse()
              .map((item) => (
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
