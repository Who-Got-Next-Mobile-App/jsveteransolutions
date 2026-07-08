import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { mockProviders, providerDisclaimer } from "@/lib/mock-data";

export default function ProvidersPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Provider & Resource Directory</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Independent resources for veterans. Not a marketplace — informational listings only.
        </p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {providerDisclaimer}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockProviders.map((provider) => (
            <div key={provider.name} className="card">
              <div className="text-xs font-semibold uppercase text-[var(--gold-500)]">{provider.category}</div>
              <h2 className="mt-1 text-lg font-bold">{provider.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{provider.description}</p>
              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <div>States: {provider.states.join(", ")}</div>
                <div>Mode: {provider.mode}</div>
                {provider.discount && <div className="text-emerald-700">{provider.discount}</div>}
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
