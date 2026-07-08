import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { mockEducation } from "@/lib/mock-data";

export default function EducationPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Veteran Success Academy</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Self-service learning center with articles, videos, checklists, templates, and webinars.
        </p>

        <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 border-[var(--gold-500)] bg-amber-50">
          <div>
            <div className="font-bold text-[var(--navy-900)]">VA Compensation &amp; GI Bill BAH Calculators</div>
            <p className="mt-1 text-sm text-slate-600">
              Estimate monthly disability pay and school housing allowance for online or on-campus enrollment.
            </p>
          </div>
          <Link href="/calculators" className="btn-primary">
            Use calculators
          </Link>
        </div>
        <div className="mt-8 grid gap-4">
          {mockEducation.map((item) => (
            <div key={item.title} className="card flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-[var(--gold-500)]">{item.category}</div>
                <div className="font-semibold text-[var(--navy-900)]">{item.title}</div>
              </div>
              <div className="text-sm text-slate-500">
                {item.type} · {item.minutes} min
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
