import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { servicePackages } from "@/lib/services-catalog";

export default function BookPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Schedule Here</h1>
        <p className="mt-3 text-slate-600">
          Create a secure client account, then book an open consultation slot from your portal. Staff publishes available
          times; you book instantly.
        </p>

        <div className="card mt-8">
          <h2 className="font-bold text-[var(--navy-900)]">Ready to book?</h2>
          <p className="mt-2 text-sm text-slate-600">
            New clients register with email verification. Existing clients can jump straight into portal scheduling.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login?portal=client" className="btn-primary">
              Create account / Sign in
            </Link>
            <Link href="/portal/appointments" className="btn-outline">
              Go to portal appointments
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {servicePackages.map((service) => (
            <div key={service.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-[var(--navy-900)]">{service.name}</h2>
                  <div className="mt-1 text-xl font-bold text-[var(--gold-500)]">{service.price}</div>
                  <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                </div>
                <Link href="/login?portal=client&next=%2Fportal%2Fappointments" className="btn-primary shrink-0">
                  Book — {service.price}
                </Link>
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
