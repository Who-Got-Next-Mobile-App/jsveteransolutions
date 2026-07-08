import { AdminNav } from "@/components/PortalShell";

export default function AdminRevenuePage() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Revenue</h1>
        <p className="mt-2 text-slate-600">Stripe payment summary — QuickBooks sync via external connector.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="card">
            <div className="text-sm text-slate-500">This month</div>
            <div className="text-2xl font-bold">$4,280</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">Consultations</div>
            <div className="text-2xl font-bold">$2,950</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">Academy memberships</div>
            <div className="text-2xl font-bold">$348</div>
          </div>
        </div>
      </main>
    </div>
  );
}
