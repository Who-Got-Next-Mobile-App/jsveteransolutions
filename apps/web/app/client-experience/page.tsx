import {
  ClientExperienceJourney,
  ScheduleConsultationCta,
  WhatMakesUsDifferentSection,
  WhatWeDontDoSection
} from "@/components/ClientExperienceSections";
import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { CLIENT_EXPERIENCE_TITLE, clientExperienceIntro } from "@/lib/client-experience";

export default function ClientExperiencePage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)] md:text-4xl">{CLIENT_EXPERIENCE_TITLE}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">{clientExperienceIntro}</p>

        <div className="mt-12">
          <ClientExperienceJourney />
        </div>

        <div className="mt-16 space-y-16">
          <WhatWeDontDoSection />
          <WhatMakesUsDifferentSection />
          <ScheduleConsultationCta />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
