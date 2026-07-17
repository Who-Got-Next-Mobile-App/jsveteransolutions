import { EmptyState } from "@/components/EmptyState";
import { PortalNav } from "@/components/PortalShell";

export default function PortalPaymentsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Payments</h1>
        <div className="mt-6">
          <EmptyState
            title="No payment history yet"
            description="Receipts and package purchases will appear here once billing is connected."
          />
        </div>
      </main>
    </div>
  );
}
