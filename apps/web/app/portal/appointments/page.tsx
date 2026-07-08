import { PortalNav } from "@/components/PortalShell";

export default function PortalAppointmentsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Appointments</h1>
        <div className="card mt-6 max-w-lg">
          <div className="text-xs font-semibold uppercase text-[var(--gold-500)]">Upcoming</div>
          <div className="mt-2 font-bold">Follow-up Consultation</div>
          <div className="mt-1 text-sm text-slate-600">Apr 5, 2026 · 2:00 PM ET · Zoom</div>
        </div>
        <div className="card mt-4 max-w-lg opacity-75">
          <div className="text-xs font-semibold uppercase text-slate-400">Completed</div>
          <div className="mt-2 font-bold">Initial Consultation</div>
          <div className="mt-1 text-sm text-slate-600">Mar 15, 2026 · Completed</div>
        </div>
      </main>
    </div>
  );
}
