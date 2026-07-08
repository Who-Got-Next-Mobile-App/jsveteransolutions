import { PortalNav } from "@/components/PortalShell";
import { mockEducation } from "@/lib/mock-data";

export default function PortalResourcesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">Assigned Resources</h1>
        <p className="mt-2 text-slate-600">Education and downloads assigned to you after consultation.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mockEducation.slice(0, 2).map((item) => (
            <div key={item.title} className="card">
              <div className="text-xs font-semibold uppercase text-[var(--gold-500)]">{item.category}</div>
              <div className="mt-1 font-semibold">{item.title}</div>
              <button type="button" className="btn-outline mt-4 text-xs">
                Open resource
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
