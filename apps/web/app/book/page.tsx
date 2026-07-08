import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { mockServices } from "@/lib/mock-data";

export default function BookPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Schedule Here</h1>
        <p className="mt-3 text-slate-600">
          Select a package to schedule your consultation. Once confirmed, you'll receive secure access to your client portal, intake, and document upload center.
        </p>
        <div className="mt-8 space-y-4">
          {mockServices.map((service) => (
            <div key={service.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-[var(--navy-900)]">{service.name}</h2>
                  <div className="mt-1 text-xl font-bold text-[var(--gold-500)]">{service.price}</div>
                  <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                </div>
                <button type="button" className="btn-primary shrink-0">
                  Book — {service.price}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already a client?{" "}
          <Link href="/portal" className="font-medium text-[var(--navy-900)]">
            Sign in to portal
          </Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
