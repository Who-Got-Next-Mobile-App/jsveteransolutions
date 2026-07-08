import { PortalNav } from "@/components/PortalShell";

export default function PortalMessagesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Messages</h1>
        <p className="mt-2 text-slate-600">Secure portal messaging — PHI stays inside the platform.</p>
        <div className="card mt-6 max-w-2xl">
          <div className="text-sm font-medium">From: Maria L. (Assistant)</div>
          <div className="mt-2 text-sm text-slate-600">
            Hi James — we received your neurology records. Could you also upload your most recent VA decision letter when
            you have a chance? You can use the upload center.
          </div>
          <div className="mt-4 text-xs text-slate-400">Mar 21, 2026</div>
        </div>
      </main>
    </div>
  );
}
