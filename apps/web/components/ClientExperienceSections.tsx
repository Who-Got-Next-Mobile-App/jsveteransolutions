import Link from "next/link";
import {
  clientExperienceSteps,
  whatMakesUsDifferent,
  whatWeDontDo,
  type ClientExperienceStep
} from "@/lib/client-experience";

function JourneyStep({ step, showCta = true }: { step: ClientExperienceStep; showCta?: boolean }) {
  return (
    <div className="flex gap-4 pb-8 last:pb-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-sm font-bold text-[var(--gold-500)]">
        {step.step}
      </div>
      <div className="card mb-0 flex-1 pb-5">
        <h3 className="text-lg font-bold text-[var(--navy-900)]">
          Step {step.step} — {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
        {step.bullets && (
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
            {step.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {step.footnote && <p className="mt-3 text-sm italic text-slate-500">{step.footnote}</p>}
        {showCta && step.cta && (
          <Link href={step.cta.href} className="btn-primary mt-4 inline-flex text-sm">
            {step.cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function ClientExperienceJourney({
  steps = clientExperienceSteps,
  limit
}: {
  steps?: ClientExperienceStep[];
  limit?: number;
}) {
  const visibleSteps = limit ? steps.slice(0, limit) : steps;

  return (
    <div>
      {visibleSteps.map((step) => (
        <JourneyStep key={step.step} step={step} />
      ))}
    </div>
  );
}

export function WhatWeDontDoSection() {
  return (
    <section className="rounded-xl border border-slate-300 bg-slate-100 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-[var(--navy-900)]">What We Don&apos;t Do</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Setting clear expectations protects you and reinforces our role as an independent consultation and education
        resource.
      </p>
      <ul className="mt-6 space-y-3">
        {whatWeDontDo.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
            <span className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true">
              —
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WhatMakesUsDifferentSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-[var(--navy-900)]">What Makes Us Different</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Professional support built around your needs — without overpromising or revealing proprietary methods.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whatMakesUsDifferent.map((item) => (
          <div key={item} className="card">
            <div className="mb-2 h-1.5 w-8 rounded bg-[var(--gold-500)]" />
            <p className="text-sm font-medium text-[var(--navy-900)]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ScheduleConsultationCta() {
  return (
    <section className="hero-gradient rounded-xl px-6 py-10 text-center text-white md:px-10">
      <h2 className="text-2xl font-bold">Ready to get started?</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-200">
        Select the service that fits your needs and take the first step toward organized, professional support.
      </p>
      <Link href="/book" className="btn-primary mt-6 inline-flex">
        Schedule Consultation
      </Link>
    </section>
  );
}
