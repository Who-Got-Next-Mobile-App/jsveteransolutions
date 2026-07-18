"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS, COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/brand";

const publicLinks = [
  { href: "/services", label: "Services" },
  { href: "/client-experience", label: "Client Experience" },
  { href: "/pricing", label: "Plans & Pricing" },
  { href: "/calculators", label: "Calculators" },
  { href: "/education", label: "Academy" },
  { href: "/providers", label: "Resources" },
  { href: "/faq", label: "FAQ" }
];

const portalLinks = [
  { href: "/login?portal=client", label: "Client Portal" },
  { href: "/login?portal=staff", label: "Provider Portal" }
];

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src={BRAND_ASSETS.navMark}
            alt={`${COMPANY_NAME} logo`}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
            priority
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-[var(--navy-900)]">{COMPANY_NAME}</div>
            <div className="hidden truncate text-xs text-slate-500 sm:block">{COMPANY_TAGLINE}</div>
          </div>
        </Link>

        <nav className="hidden min-w-0 items-center gap-5 xl:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-[var(--navy-900)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 xl:flex">
          {portalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-[var(--navy-900)]"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/book" className="btn-primary whitespace-nowrap">
            Book Online
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[var(--navy-900)] xl:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white xl:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-slate-100" />
            {portalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 text-center"
            >
              Book Online
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[var(--navy-950)] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Image
            src={BRAND_ASSETS.fullLogoTransparent}
            alt={COMPANY_NAME}
            width={220}
            height={180}
            className="h-auto w-44 object-contain object-left"
          />
          <p className="mt-3 text-sm leading-relaxed">
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
            <Link href="/login?portal=staff">Provider Portal</Link>
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
