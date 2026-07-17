"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PortalNav } from "@/components/PortalShell";
import { apiFetch, type TasksResponse } from "@/lib/api";

export default function PortalTasksPage() {
  const [tasks, setTasks] = useState<TasksResponse["tasks"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadTasks() {
    const data = await apiFetch<TasksResponse>("/v1/tasks");
    setTasks(data.tasks);
  }

  useEffect(() => {
    loadTasks().catch((err) => setError(err instanceof Error ? err.message : "Failed to load tasks"));
  }, []);

  async function updateStatus(taskId: string, status: string) {
    setUpdatingId(taskId);
    setError(null);
    try {
      await apiFetch(`/v1/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">My Tasks</h1>
        <p className="mt-2 text-slate-600">Action items assigned by your care team.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[var(--navy-900)]">{task.title}</h2>
                  {task.description && <p className="mt-1 text-sm text-slate-600">{task.description}</p>}
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                    {task.status.replace(/_/g, " ")}
                    {task.dueAt ? ` · Due ${new Date(task.dueAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {task.status !== "done" && (
                    <>
                      <button
                        type="button"
                        className="btn-outline text-xs"
                        disabled={updatingId === task.id}
                        onClick={() => updateStatus(task.id, "in_progress")}
                      >
                        In progress
                      </button>
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={updatingId === task.id}
                        onClick={() => updateStatus(task.id, "done")}
                      >
                        Mark done
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!tasks.length && !error && (
            <EmptyState title="No tasks yet" description="When your care team assigns action items, they will appear here." />
          )}
        </div>
      </main>
    </div>
  );
}
