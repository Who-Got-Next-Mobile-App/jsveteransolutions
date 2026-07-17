"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PortalNav } from "@/components/PortalShell";
import { apiFetch, type AppointmentsResponse, type AvailabilityResponse } from "@/lib/api";

export default function PortalAppointmentsPage() {
  const [slots, setSlots] = useState<AvailabilityResponse["slots"]>([]);
  const [appointments, setAppointments] = useState<AppointmentsResponse["appointments"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  async function load() {
    const [availability, booked] = await Promise.all([
      apiFetch<AvailabilityResponse>("/v1/availability"),
      apiFetch<AppointmentsResponse>("/v1/appointments")
    ]);
    setSlots(availability.slots);
    setAppointments(booked.appointments);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load appointments"));
  }, []);

  async function bookSlot(slotId: string) {
    setBookingId(slotId);
    setError(null);
    try {
      await apiFetch("/v1/appointments", { method: "POST", body: JSON.stringify({ slotId }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookingId(null);
    }
  }

  async function cancelAppointment(id: string) {
    setError(null);
    try {
      await apiFetch(`/v1/appointments/${id}/cancel`, { method: "PATCH", body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Appointments</h1>
        <p className="mt-2 text-slate-600">Book an open consultation slot instantly.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-semibold text-[var(--navy-900)]">Open slots</h2>
            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium capitalize">{slot.consultationType.replace(/_/g, " ")}</div>
                    <div className="text-sm text-slate-600">
                      {new Date(slot.startsAt).toLocaleString()} – {new Date(slot.endsAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    disabled={bookingId === slot.id}
                    onClick={() => bookSlot(slot.id)}
                  >
                    {bookingId === slot.id ? "Booking..." : "Book"}
                  </button>
                </div>
              ))}
              {!slots.length && (
                <EmptyState title="No open slots" description="Your care team has not published available times yet." />
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-[var(--navy-900)]">My appointments</h2>
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium capitalize">{appointment.type.replace(/_/g, " ")}</div>
                    <div className="text-sm text-slate-600">
                      {appointment.scheduledStartAt
                        ? new Date(appointment.scheduledStartAt).toLocaleString()
                        : "Unscheduled"}
                    </div>
                    <div className="text-xs uppercase text-slate-400">{appointment.attendanceStatus.replace(/_/g, " ")}</div>
                  </div>
                  {appointment.attendanceStatus === "scheduled" && (
                    <button type="button" className="btn-outline text-xs" onClick={() => cancelAppointment(appointment.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              ))}
              {!appointments.length && (
                <EmptyState title="No appointments scheduled" description="Book an open slot to schedule your consultation." />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
