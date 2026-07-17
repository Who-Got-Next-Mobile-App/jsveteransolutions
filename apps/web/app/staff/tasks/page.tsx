"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type StaffProfilesResponse, type TasksResponse } from "@/lib/api";

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<TasksResponse["tasks"]>([]);
  const [clients, setClients] = useState<StaffProfilesResponse["profiles"]>([]);
  const [clientProfileId, setClientProfileId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [taskResponse, clientResponse] = await Promise.all([
      apiFetch<TasksResponse>("/v1/staff/tasks"),
      apiFetch<StaffProfilesResponse>("/v1/profiles")
    ]);
    setTasks(taskResponse.tasks);
    setClients(clientResponse.profiles);
    if (!clientProfileId && clientResponse.profiles[0]) {
      setClientProfileId(clientResponse.profiles[0].id);
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load tasks"));
  }, []);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!clientProfileId) return;
    setError(null);
    try {
      await apiFetch(`/v1/staff/clients/${clientProfileId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title, description, visibility: "client_visible" })
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function markDone(taskId: string) {
    try {
      await apiFetch(`/v1/staff/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status: "done" }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Tasks</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={createTask} className="card mt-6 max-w-xl space-y-3">
          <h2 className="font-semibold">Assign task</h2>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={clientProfileId}
            onChange={(event) => setClientProfileId(event.target.value)}
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Task title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <button type="submit" className="btn-primary">
            Create task
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="card flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-slate-600">{task.description}</div>
                <div className="mt-1 text-xs uppercase text-slate-400">{task.status.replace(/_/g, " ")}</div>
                <Link href={`/staff/clients/${task.clientProfileId}`} className="mt-2 inline-block text-xs text-[var(--navy-800)] hover:underline">
                  View client →
                </Link>
              </div>
              {task.status !== "done" && (
                <button type="button" className="btn-outline text-xs" onClick={() => markDone(task.id)}>
                  Mark done
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
