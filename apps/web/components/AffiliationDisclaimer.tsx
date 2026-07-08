import { AFFILIATION_DISCLAIMER, COMPANY_NAME } from "@/lib/brand";
import { officialSeals } from "@/lib/official-seals";

export function AffiliationDisclaimer() {
  return (
    <section className="border-t border-slate-200 bg-white" aria-label="Affiliation disclaimer">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {officialSeals.map((logo) => (
            <div key={logo.alt} className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.alt}
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] object-contain"
              />
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{logo.label}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-4xl text-center text-xs leading-relaxed text-slate-500">
          {AFFILIATION_DISCLAIMER}
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">© {new Date().getFullYear()} {COMPANY_NAME}</p>
      </div>
    </section>
  );
}
