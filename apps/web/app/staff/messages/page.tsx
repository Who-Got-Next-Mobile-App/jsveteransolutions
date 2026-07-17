"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type StaffProfilesResponse, type ThreadDetailResponse, type ThreadsResponse } from "@/lib/api";

export default function StaffMessagesPage() {
  const [threads, setThreads] = useState<ThreadsResponse["threads"]>([]);
  const [clients, setClients] = useState<StaffProfilesResponse["profiles"]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetailResponse | null>(null);
  const [clientProfileId, setClientProfileId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadThreads() {
    const [threadResponse, clientResponse] = await Promise.all([
      apiFetch<ThreadsResponse>("/v1/staff/messages"),
      apiFetch<StaffProfilesResponse>("/v1/profiles")
    ]);
    setThreads(threadResponse.threads);
    setClients(clientResponse.profiles);
    if (!clientProfileId && clientResponse.profiles[0]) setClientProfileId(clientResponse.profiles[0].id);
  }

  async function openThread(id: string) {
    const data = await apiFetch<ThreadDetailResponse>(`/v1/staff/messages/${id}`);
    setDetail(data);
    setSelectedId(id);
  }

  useEffect(() => {
    loadThreads().catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages"));
  }, []);

  async function createThread(event: FormEvent) {
    event.preventDefault();
    if (!clientProfileId) return;
    try {
      const created = await apiFetch<ThreadDetailResponse>(`/v1/staff/clients/${clientProfileId}/messages`, {
        method: "POST",
        body: JSON.stringify({ subject, body })
      });
      setSubject("");
      setBody("");
      await loadThreads();
      await openThread(created.thread.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    try {
      await apiFetch(`/v1/staff/messages/${selectedId}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: reply })
      });
      setReply("");
      await openThread(selectedId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reply");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Secure Messages</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <form onSubmit={createThread} className="card space-y-3">
              <h2 className="font-semibold">Message a client</h2>
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
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
              />
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Message"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Send
              </button>
            </form>

            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`w-full rounded-xl border px-4 py-3 text-left ${
                  selectedId === thread.id ? "border-[var(--gold-500)] bg-amber-50" : "border-slate-200 bg-white"
                }`}
                onClick={() => openThread(thread.id).catch((err) => setError(err instanceof Error ? err.message : "Failed to open"))}
              >
                <div className="font-medium">{thread.subject}</div>
                <div className="text-xs text-slate-500">{new Date(thread.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>

          <div className="card min-h-80">
            {!detail ? (
              <p className="text-sm text-slate-500">Select a thread.</p>
            ) : (
              <div>
                <h2 className="font-semibold">{detail.thread.subject}</h2>
                <div className="mt-4 space-y-3">
                  {detail.messages.map((message) => (
                    <div key={message.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleString()}</div>
                      <div className="mt-1 whitespace-pre-wrap">{message.body}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendReply} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    required
                  />
                  <button type="submit" className="btn-primary">
                    Reply
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
