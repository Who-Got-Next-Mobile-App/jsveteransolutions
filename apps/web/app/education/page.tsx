import { PublicFooter, PublicNav } from "@/components/PublicNav";
import Link from "next/link";

export default function EducationPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--navy-900)]">Veteran Success Academy</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Articles, checklists, and videos to help you understand your VA claim journey.
        </p>
        <div className="card mt-8 max-w-2xl">
          <h2 className="font-bold text-[var(--navy-900)]">Content coming soon</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your care team will publish education resources here. After consultation, assigned materials will also
            appear in your client portal.
          </p>
          <Link href="/book" className="btn-primary mt-4 inline-flex text-sm">
            Schedule consultation
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
