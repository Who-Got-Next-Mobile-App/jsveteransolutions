"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type ReferralSubmissionsResponse } from "@/lib/api";

type Submission = ReferralSubmissionsResponse["submissions"][number];
type StatusFilter = "all" | "pending" | "reviewed" | "archived";

const CATEGORY_LABELS: Record<string, string> = {
  realtor: "Realtor",
  attorney: "Attorney",
  educator: "Educator",
  developer: "Developer",
  other: "Other"
};

function preferenceLabel(value: string) {
  if (value === "text") return "Text preferred";
  if (value === "call") return "Call preferred";
  return "Text or call";
}

function BioPreview({ submission }: { submission: Submission }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
      <p>Thank you for the opportunity to be a preferred provider.</p>
      <p className="mt-3">
        <span className="font-semibold">Business Name:</span> {submission.businessName}
      </p>
      <p className="mt-1">
        <span className="font-semibold">Category:</span> {CATEGORY_LABELS[submission.category] ?? submission.category}
      </p>
      <div className="mt-3">
        <div className="font-semibold">Preferred Contact Information:</div>
        <ul className="mt-1 list-disc pl-5">
          {submission.contacts.map((contact) => (
            <li key={`${contact.name}-${contact.phone}`}>
              {contact.name}: {contact.phone}
            </li>
          ))}
        </ul>
      </div>
      {(submission.communicationNotes || submission.communicationPreference) && (
        <p className="mt-3">
          {submission.communicationNotes || preferenceLabel(submission.communicationPreference)}
        </p>
      )}
      <div className="mt-3">
        <div className="font-semibold">Services We Offer:</div>
        <ul className="mt-1 list-disc pl-5">
          {submission.services.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3">
        <div className="font-semibold">Service Area:</div>
        <p className="mt-1">{submission.serviceArea}</p>
      </div>
      {(submission.email || submission.websiteUrl) && (
        <div className="mt-3 space-y-1">
          {submission.email && (
            <p>
              <span className="font-semibold">Email:</span> {submission.email}
            </p>
          )}
          {submission.websiteUrl && (
            <p>
              <span className="font-semibold">Website:</span> {submission.websiteUrl}
            </p>
          )}
        </div>
      )}
      {submission.notes && <p className="mt-3">{submission.notes}</p>}
    </div>
  );
}

export default function StaffReferralsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load(status: StatusFilter) {
    const path = status === "all" ? "/v1/staff/referrals" : `/v1/staff/referrals?status=${status}`;
    const data = await apiFetch<ReferralSubmissionsResponse>(path);
    setSubmissions(data.submissions);
  }

  useEffect(() => {
    load(filter).catch((err) => setError(err instanceof Error ? err.message : "Failed to load referrals"));
  }, [filter]);

  const counts = useMemo(() => {
    return {
      total: submissions.length
    };
  }, [submissions.length]);

  async function updateStatus(id: string, status: "reviewed" | "archived") {
    setUpdatingId(id);
    setError(null);
    try {
      await apiFetch(`/v1/staff/referrals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update submission");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--navy-900)]">Referral submissions</h1>
            <p className="mt-2 text-slate-600">
              Uniform provider bios collected from the public apply link. Showing {counts.total} result
              {counts.total === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["pending", "reviewed", "archived", "all"] as StatusFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                  filter === value
                    ? "bg-[var(--navy-900)] text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 space-y-6">
          {submissions.map((submission) => (
            <article key={submission.id} className="card space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--navy-900)]">{submission.businessName}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {CATEGORY_LABELS[submission.category] ?? submission.category} · {submission.status} ·{" "}
                    {new Date(submission.createdAt).toLocaleString()}
                  </p>
                </div>
                {submission.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updatingId === submission.id}
                      onClick={() => updateStatus(submission.id, "reviewed")}
                      className="btn-primary text-sm disabled:opacity-60"
                    >
                      Mark reviewed
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === submission.id}
                      onClick={() => updateStatus(submission.id, "archived")}
                      className="btn-outline text-sm disabled:opacity-60"
                    >
                      Archive
                    </button>
                  </div>
                )}
                {submission.status === "reviewed" && (
                  <button
                    type="button"
                    disabled={updatingId === submission.id}
                    onClick={() => updateStatus(submission.id, "archived")}
                    className="btn-outline text-sm disabled:opacity-60"
                  >
                    Archive
                  </button>
                )}
              </div>
              <BioPreview submission={submission} />
            </article>
          ))}

          {!submissions.length && (
            <div className="card text-sm text-slate-500">No referral submissions in this filter yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
