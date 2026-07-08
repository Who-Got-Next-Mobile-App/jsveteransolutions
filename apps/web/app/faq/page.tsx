import { PublicFooter, PublicNav } from "@/components/PublicNav";

const faqs = [
  { q: "Is this legal advice?", a: "No. Consultation and education services do not constitute legal advice or VA representation." },
  { q: "How are my records stored?", a: "Documents are encrypted in AWS S3 with HIPAA-capable infrastructure. Metadata is stored separately in a secure database." },
  { q: "Can I message my consultant?", a: "Yes. Secure portal messaging keeps sensitive content inside the platform rather than email." },
  { q: "Are listed providers part of your business?", a: "No. Providers are independent businesses listed for informational purposes only." }
];

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">FAQ</h1>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="card">
              <h2 className="font-bold text-[var(--navy-900)]">{faq.q}</h2>
              <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
