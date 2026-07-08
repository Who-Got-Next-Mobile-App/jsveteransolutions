import Link from "next/link";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/brand";

const publicLinks = [
  { href: "/services", label: "Services" },
  { href: "/client-experience", label: "Client Experience" },
  { href: "/pricing", label: "Plans & Pricing" },
  { href: "/calculators", label: "Calculators" },
  { href: "/education", label: "Academy" },
  { href: "/providers", label: "Resources" },
  { href: "/faq", label: "FAQ" }
];

export function PublicNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--navy-900)] text-sm font-bold text-[var(--gold-500)]">
            JS
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--navy-900)]">{COMPANY_NAME}</div>
            <div className="text-xs text-slate-500">{COMPANY_TAGLINE}</div>
          </div>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-6 lg:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-[var(--navy-900)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login?portal=client"
            className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-[var(--navy-900)]"
          >
            Client Login
          </Link>
          <Link href="/book" className="btn-primary ml-2 shrink-0 whitespace-nowrap">
            Book Online
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[var(--navy-950)] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold text-white">{COMPANY_NAME}</div>
          <p className="mt-2 text-sm leading-relaxed">
            Organized, professional veteran support for VA claims, documentation, education, and claim preparation.
          </p>
        </div>
        <div>
          <div className="font-semibold text-white">Quick Links</div>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            <Link href="/client-experience">Client Experience</Link>
            <Link href="/calculators">Calculators</Link>
            <Link href="/login?portal=client">Client Portal</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-white">Compliance</div>
          <p className="mt-3 text-sm leading-relaxed">
            HIPAA-capable AWS architecture. Secure portal messaging and document handling. PHI stays inside the portal.
          </p>
        </div>
      </div>
    </footer>
  );
}
