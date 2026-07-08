"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

interface NavLink {
  href: string;
  label: string;
}

function SidebarUser({ variant }: { variant: "portal" | "staff" }) {
  const { session, logout } = useAuth();

  return (
    <div className={`mt-8 border-t pt-4 ${variant === "staff" ? "border-white/10" : "border-slate-200"}`}>
      {session && (
        <div className={`mb-3 text-xs ${variant === "staff" ? "text-slate-400" : "text-slate-500"}`}>
          <div className="font-medium">{session.displayName}</div>
          <div className="capitalize">{session.role}</div>
        </div>
      )}
      <button
        type="button"
        onClick={logout}
        className={`text-sm ${variant === "staff" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
      >
        Sign out
      </button>
      <div className="mt-3">
        <Link href="/" className={`text-sm ${variant === "staff" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>
          ← Back to public site
        </Link>
      </div>
    </div>
  );
}

export function PortalNav() {
  const links: NavLink[] = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/documents", label: "Documents" },
    { href: "/portal/claim", label: "Claim Status" },
    { href: "/portal/tasks", label: "Tasks" },
    { href: "/portal/messages", label: "Messages" },
    { href: "/portal/appointments", label: "Appointments" },
    { href: "/portal/payments", label: "Payments" },
    { href: "/portal/resources", label: "Resources" }
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Client Portal</div>
        <div className="mt-1 font-bold text-[var(--navy-900)]">JS Veteran Solutions</div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-[var(--navy-900)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <SidebarUser variant="portal" />
    </aside>
  );
}

export function AdminNav() {
  const links: NavLink[] = [
    { href: "/staff", label: "Dashboard" },
    { href: "/staff/clients", label: "Clients" },
    { href: "/staff/documents", label: "Document Queue" },
    { href: "/staff/revenue", label: "Revenue" }
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-[var(--navy-950)] p-4 text-slate-300">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staff Portal</div>
        <div className="mt-1 font-bold text-white">Operations</div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <SidebarUser variant="staff" />
    </aside>
  );
}
