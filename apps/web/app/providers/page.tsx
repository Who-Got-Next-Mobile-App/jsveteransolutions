import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { PROVIDER_DIRECTORY_DISCLAIMER } from "@/lib/brand";

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
          {PROVIDER_DIRECTORY_DISCLAIMER}
        </div>
        <div className="card mt-8 max-w-2xl text-sm text-slate-600">
          Provider listings will be published here as JS Veteran Solutions expands its resource network.
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
