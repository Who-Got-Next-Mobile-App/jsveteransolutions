import { COMPANY_NAME } from "@/lib/brand";
import Link from "next/link";
import {
  ClientExperienceJourney,
  ScheduleConsultationCta
} from "@/components/ClientExperienceSections";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { CLIENT_EXPERIENCE_TITLE, clientExperienceTeaser } from "@/lib/client-experience";
import { mockEducation, mockServices } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="hero-gradient px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {COMPANY_NAME}
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Organized, professional support for your VA claim journey
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">
              From group information sessions to full-service packages with appraisal reports, claims plans, professional
              deliverables, and mock C&amp;P exam preparation — all in one secure client portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="btn-primary">
                Schedule Consultation
              </Link>
              <Link href="/portal" className="btn-secondary">
                Client Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-[var(--navy-900)]">Veteran Service Packages</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Personalized packages from a monthly group session to full-service support with appraisal reports, claims
          plans, organized deliverables, and mock C&amp;P exam preparation.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockServices.map((service) => (
            <div key={service.id} className="card">
              <div className="text-lg font-bold text-[var(--navy-900)]">{service.name}</div>
              <div className="mt-1 text-xl font-bold text-[var(--gold-500)]">{service.price}</div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.description}</p>
              <Link href="/book" className="btn-outline mt-4 text-sm">
                Book package
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--navy-900)]">{CLIENT_EXPERIENCE_TITLE}</h2>
              <p className="mt-2 max-w-2xl text-slate-600">{clientExperienceTeaser}</p>
            </div>
            <Link href="/client-experience" className="btn-outline shrink-0">
              See the full client experience
            </Link>
          </div>
          <div className="mt-10">
            <ClientExperienceJourney limit={3} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <ScheduleConsultationCta />
      </section>

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--navy-900)]">Benefit Calculators</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                See how much you may receive at your disability rating and how GI Bill housing changes for online vs
                on-campus school.
              </p>
            </div>
            <Link href="/calculators" className="btn-primary">
              Open calculators
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="card">
              <h3 className="font-bold text-[var(--navy-900)]">VA Compensation</h3>
              <p className="mt-2 text-sm text-slate-600">
                Enter your combined rating and dependents to estimate monthly tax-free pay.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold text-[var(--navy-900)]">GI Bill BAH / MHA</h3>
              <p className="mt-2 text-sm text-slate-600">
                Compare online-only vs on-campus housing allowance for your school location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--navy-900)]">Veteran Success Academy</h2>
            <p className="mt-2 text-slate-600">Starter education library preview</p>
          </div>
          <Link href="/education" className="btn-outline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {mockEducation.map((item) => (
            <div key={item.title} className="card flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--gold-500)]">{item.category}</div>
                <div className="mt-1 font-semibold text-[var(--navy-900)]">{item.title}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {item.type} · {item.minutes} min
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
