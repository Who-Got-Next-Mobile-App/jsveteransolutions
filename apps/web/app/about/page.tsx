import { PublicFooter, PublicNav } from "@/components/PublicNav";
import { COMPANY_NAME } from "@/lib/brand";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">About {COMPANY_NAME}</h1>
        <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
          <p>
            {COMPANY_NAME} provides organized, professional support for veterans navigating the VA claims process. We
            combine consultation, secure document collection, education, and trusted resource navigation in one branded
            client experience.
          </p>
          <p>
            Our focus is on helping you understand your situation, organize available information, and receive
            individualized guidance and educational resources appropriate for where you are in the process.
          </p>
          <p>
            We do not guarantee outcomes or act on behalf of the VA. Our role is consultation and education — helping
            you feel informed, prepared, and supported every step of the way.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
