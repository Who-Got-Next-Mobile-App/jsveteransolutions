"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PortalNav } from "@/components/PortalShell";
import { apiFetch, type ThreadDetailResponse, type ThreadsResponse } from "@/lib/api";

export default function PortalMessagesPage() {
  const [threads, setThreads] = useState<ThreadsResponse["threads"]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  async function loadThreads() {
    const data = await apiFetch<ThreadsResponse>("/v1/messages");
    setThreads(data.threads);
  }

  async function loadThread(id: string) {
    const data = await apiFetch<ThreadDetailResponse>(`/v1/messages/${id}`);
    setDetail(data);
    setSelectedId(id);
  }

  useEffect(() => {
    loadThreads().catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages"));
  }, []);

  async function createThread(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await apiFetch<ThreadDetailResponse>("/v1/messages", {
        method: "POST",
        body: JSON.stringify({ subject, body })
      });
      setSubject("");
      setBody("");
      await loadThreads();
      await loadThread(created.thread.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    setError(null);
    try {
      await apiFetch(`/v1/messages/${selectedId}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: reply })
      });
      setReply("");
      await loadThread(selectedId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reply");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Messages</h1>
        <p className="mt-2 text-slate-600">Secure portal messaging — PHI stays inside the platform.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <form onSubmit={createThread} className="card space-y-3">
              <h2 className="font-semibold text-[var(--navy-900)]">Start a conversation</h2>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
              />
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Message"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Send message
              </button>
            </form>

            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => loadThread(thread.id).catch((err) => setError(err instanceof Error ? err.message : "Failed to open thread"))}
                  className={`w-full rounded-xl border px-4 py-3 text-left ${
                    selectedId === thread.id ? "border-[var(--gold-500)] bg-amber-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="font-medium text-[var(--navy-900)]">{thread.subject}</div>
                  <div className="text-xs text-slate-500">
                    {thread.isClosed ? "Closed" : "Open"} · Updated {new Date(thread.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))}
              {!threads.length && <EmptyState title="No messages yet" description="Start a secure conversation with your care team." />}
            </div>
          </div>

          <div className="card min-h-80">
            {!detail ? (
              <p className="text-sm text-slate-500">Select a conversation to view messages.</p>
            ) : (
              <div className="flex h-full flex-col">
                <h2 className="font-semibold text-[var(--navy-900)]">{detail.thread.subject}</h2>
                <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
                  {detail.messages.map((message) => (
                    <div key={message.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleString()}</div>
                      <div className="mt-1 whitespace-pre-wrap">{message.body}</div>
                    </div>
                  ))}
                </div>
                {!detail.thread.isClosed && (
                  <form onSubmit={sendReply} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <textarea
                      className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Write a reply"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      required
                    />
                    <button type="submit" className="btn-primary">
                      Reply
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
