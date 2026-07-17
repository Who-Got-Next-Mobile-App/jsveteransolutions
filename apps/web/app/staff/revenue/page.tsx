import { EmptyState } from "@/components/EmptyState";
import { AdminNav } from "@/components/PortalShell";

export default function AdminRevenuePage() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Revenue</h1>
        <p className="mt-2 text-slate-600">Stripe payment summary — QuickBooks sync via external connector.</p>
        <div className="mt-6">
          <EmptyState
            title="Revenue reporting coming soon"
            description="Payment totals will appear here once Stripe is connected to your packages and consultations."
          />
        </div>
      </main>
    </div>
  );
}
