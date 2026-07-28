"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cognitoManagePasskeyUrl, isCognitoConfigured } from "@/lib/auth/cognito";
import { formatSessionDisplayName } from "@/lib/person-name";

interface NavLink {
  href: string;
  label: string;
}

function SidebarUser({ variant }: { variant: "portal" | "staff" }) {
  const { session, logout } = useAuth();
  const managePasskeyUrl = isCognitoConfigured() ? cognitoManagePasskeyUrl() : null;
  const showPasskeyLink = session?.mode === "cognito" && managePasskeyUrl;
  const displayName = session
    ? formatSessionDisplayName(session.displayName, session.email)
    : "";

  return (
    <div className={`shrink-0 border-t pt-4 ${variant === "staff" ? "border-white/10" : "border-slate-200"}`}>
      {session && (
        <div className={`mb-3 text-xs ${variant === "staff" ? "text-slate-400" : "text-slate-500"}`}>
          <div className="font-medium">{displayName}</div>
          <div className="capitalize">{session.role === "assistant" ? "provider" : session.role}</div>
        </div>
      )}
      {showPasskeyLink && (
        <a
          href={managePasskeyUrl}
          className={`mb-3 block text-sm ${variant === "staff" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
        >
          Manage passkey
        </a>
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

function SidebarShell({
  variant,
  brandEyebrow,
  brandTitle,
  links
}: {
  variant: "portal" | "staff";
  brandEyebrow: string;
  brandTitle: string;
  links: NavLink[];
}) {
  const isStaff = variant === "staff";

  return (
    <aside
      className={`flex h-svh w-56 shrink-0 flex-col border-r p-4 ${
        isStaff ? "border-slate-200 bg-[var(--navy-950)] text-slate-300" : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-6 shrink-0">
        <div
          className={`text-xs font-semibold uppercase tracking-wide ${
            isStaff ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {brandEyebrow}
        </div>
        <div className={`mt-1 font-bold ${isStaff ? "text-white" : "text-[var(--navy-900)]"}`}>{brandTitle}</div>
      </div>
      <nav className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1 pb-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              isStaff
                ? "hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-[var(--navy-900)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <SidebarUser variant={variant} />
    </aside>
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
    <SidebarShell
      variant="portal"
      brandEyebrow="Client Portal"
      brandTitle="JS Veteran Solutions"
      links={links}
    />
  );
}

export function AdminNav() {
  const links: NavLink[] = [
    { href: "/staff", label: "Dashboard" },
    { href: "/staff/clients", label: "Clients" },
    { href: "/staff/team", label: "Team" },
    { href: "/staff/referrals", label: "Referrals" },
    { href: "/staff/documents", label: "Document Queue" },
    { href: "/staff/tasks", label: "Tasks" },
    { href: "/staff/messages", label: "Messages" },
    { href: "/staff/schedule", label: "Schedule" },
    { href: "/staff/resources", label: "Resources" },
    { href: "/staff/revenue", label: "Revenue" }
  ];

  return (
    <SidebarShell variant="staff" brandEyebrow="Provider Portal" brandTitle="Operations" links={links} />
  );
}
