"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { COMPANY_NAME, PROVIDER_DIRECTORY_DISCLAIMER } from "@/lib/brand";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CATEGORIES = [
  { value: "realtor", label: "Realtor" },
  { value: "attorney", label: "Attorney" },
  { value: "educator", label: "Educator" },
  { value: "developer", label: "Developer" },
  { value: "other", label: "Other" }
] as const;

const PREFERENCES = [
  { value: "text", label: "Text messages preferred" },
  { value: "call", label: "Phone calls preferred" },
  { value: "either", label: "Text or call is fine" }
] as const;

export default function ReferralApplyPage() {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("other");
  const [contact1Name, setContact1Name] = useState("");
  const [contact1Phone, setContact1Phone] = useState("");
  const [contact2Name, setContact2Name] = useState("");
  const [contact2Phone, setContact2Phone] = useState("");
  const [communicationPreference, setCommunicationPreference] =
    useState<(typeof PREFERENCES)[number]["value"]>("text");
  const [communicationNotes, setCommunicationNotes] = useState(
    "Text messages are preferred, as they help us respond more accurately and efficiently."
  );
  const [servicesText, setServicesText] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const contacts = [
      { name: contact1Name, phone: contact1Phone },
      ...(contact2Name.trim() && contact2Phone.trim()
        ? [{ name: contact2Name, phone: contact2Phone }]
        : [])
    ];

    const services = servicesText
      .split("\n")
      .map((line) => line.replace(/^[-•*\s]+/, "").trim())
      .filter(Boolean);

    try {
      const response = await fetch(`${API_URL}/v1/referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          category,
          contacts,
          communicationPreference,
          communicationNotes: communicationNotes || undefined,
          services,
          serviceArea,
          email: email || undefined,
          websiteUrl: websiteUrl || undefined,
          notes: notes || undefined,
          disclaimerAccepted: true
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Unable to submit referral");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit referral");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{COMPANY_NAME}</div>
        <h1 className="mt-2 text-3xl font-bold text-[var(--navy-900)]">Preferred provider application</h1>
        <p className="mt-3 text-slate-600">
          Share your business bio in a uniform format. Submissions are reviewed by our team before any listing
          decisions.
        </p>

        {submitted ? (
          <div className="card mt-8 space-y-3">
            <h2 className="text-xl font-bold text-[var(--navy-900)]">Thank you</h2>
            <p className="text-slate-600">
              Your information was received. Our team will review it and follow up if needed.
            </p>
            <Link href="/providers" className="btn-outline inline-flex">
              Back to Resources
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Business name</label>
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="JC Osto Lawn Care Service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number]["value"])}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Primary contact name</label>
                <input
                  required
                  value={contact1Name}
                  onChange={(e) => setContact1Name(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Primary contact phone</label>
                <input
                  required
                  value={contact1Phone}
                  onChange={(e) => setContact1Phone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Second contact name (optional)</label>
                <input
                  value={contact2Name}
                  onChange={(e) => setContact2Name(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Second contact phone (optional)</label>
                <input
                  value={contact2Phone}
                  onChange={(e) => setContact2Phone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Preferred contact method</label>
              <select
                value={communicationPreference}
                onChange={(e) =>
                  setCommunicationPreference(e.target.value as (typeof PREFERENCES)[number]["value"])
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {PREFERENCES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <textarea
                value={communicationNotes}
                onChange={(e) => setCommunicationNotes(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Any notes about how you prefer to be contacted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Services offered</label>
              <p className="mt-1 text-xs text-slate-500">Enter one service per line.</p>
              <textarea
                required
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                rows={8}
                placeholder={"Landscaping\nLawn Maintenance\nPressure Washing"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Service area</label>
              <textarea
                required
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={2}
                placeholder="We are willing to travel up to 40-50 miles, depending on the job."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Website (optional)</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="https://"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Additional notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={3}
                placeholder="Short intro or closing note"
              />
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <input
                type="checkbox"
                required
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-1"
              />
              <span>{PROVIDER_DIRECTORY_DISCLAIMER}</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting || !disclaimerAccepted} className="btn-primary disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit bio"}
            </button>
          </form>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
