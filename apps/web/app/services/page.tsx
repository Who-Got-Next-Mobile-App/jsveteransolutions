import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { mockServices } from "@/lib/mock-data";

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Veteran Services</h1>
        <p className="mt-3 max-w-3xl text-slate-600 leading-relaxed">
          We offer a range of personalized packages: from a monthly group information session to full-service support
          including individual appraisals, claims plans, organized deliverables, and mock C&amp;P exam preparation. Each
          package is structured to give veterans clarity, confidence, and actionable guidance.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {mockServices.map((service) => (
            <div key={service.id} className="card">
              <h2 className="text-xl font-bold">{service.name}</h2>
              <div className="mt-2 text-2xl font-bold text-[var(--gold-500)]">{service.price}</div>
              <p className="mt-3 text-slate-600">{service.description}</p>
              <Link href="/book" className="btn-primary mt-4">
                Book
              </Link>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
