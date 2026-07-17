"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminNav } from "@/components/PortalShell";
import { apiFetch, type AppointmentsResponse, type AvailabilityResponse } from "@/lib/api";

export default function StaffSchedulePage() {
  const [slots, setSlots] = useState<AvailabilityResponse["slots"]>([]);
  const [appointments, setAppointments] = useState<AppointmentsResponse["appointments"]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [consultationType, setConsultationType] = useState("initial_consultation");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [slotResponse, appointmentResponse] = await Promise.all([
      apiFetch<AvailabilityResponse>("/v1/staff/availability"),
      apiFetch<AppointmentsResponse>("/v1/staff/appointments")
    ]);
    setSlots(slotResponse.slots);
    setAppointments(appointmentResponse.appointments);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load schedule"));
  }, []);

  async function createSlot(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/staff/availability", {
        method: "POST",
        body: JSON.stringify({
          consultationType,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString()
        })
      });
      setStartsAt("");
      setEndsAt("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create slot");
    }
  }

  async function cancelSlot(id: string) {
    try {
      await apiFetch(`/v1/staff/availability/${id}/cancel`, { method: "PATCH", body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel slot");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Schedule</h1>
        <p className="mt-2 text-slate-600">Publish fixed slots clients can book instantly.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={createSlot} className="card mt-6 max-w-xl space-y-3">
          <h2 className="font-semibold">Publish availability</h2>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={consultationType}
            onChange={(event) => setConsultationType(event.target.value)}
          >
            <option value="initial_consultation">Initial consultation</option>
            <option value="follow_up_consultation">Follow-up consultation</option>
            <option value="medical_record_review">Medical record review</option>
            <option value="evidence_organization">Evidence organization</option>
          </select>
          <label className="block text-sm">
            Starts at
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Ends at
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary">
            Publish slot
          </button>
        </form>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-semibold">Availability</h2>
            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium capitalize">{slot.consultationType.replace(/_/g, " ")}</div>
                    <div className="text-sm text-slate-600">{new Date(slot.startsAt).toLocaleString()}</div>
                    <div className="text-xs uppercase text-slate-400">{slot.status}</div>
                  </div>
                  {slot.status === "open" && (
                    <button type="button" className="btn-outline text-xs" onClick={() => cancelSlot(slot.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-semibold">Booked appointments</h2>
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="card">
                  <div className="font-medium capitalize">{appointment.type.replace(/_/g, " ")}</div>
                  <div className="text-sm text-slate-600">
                    {appointment.scheduledStartAt
                      ? new Date(appointment.scheduledStartAt).toLocaleString()
                      : "Unscheduled"}
                  </div>
                  <div className="text-xs uppercase text-slate-400">{appointment.attendanceStatus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
