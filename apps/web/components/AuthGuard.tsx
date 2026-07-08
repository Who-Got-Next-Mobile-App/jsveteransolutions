"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { PortalKind } from "@/lib/auth/types";
import type { UserRole } from "@vsn/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  portal: PortalKind;
}

export function AuthGuard({ children, allowedRoles, portal }: AuthGuardProps) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?portal=${portal}&next=${next}`);
      return;
    }
    if (!allowedRoles.includes(session.role)) {
      const fallback = session.role === "client" ? "/portal" : "/staff";
      router.replace(fallback);
    }
  }, [allowedRoles, loading, pathname, portal, router, session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold text-[var(--navy-900)]">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-600">Redirecting to login...</p>
          <Link
            href={`/login?portal=${portal}&next=${encodeURIComponent(pathname)}`}
            className="btn-primary mt-4 inline-flex"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function LoginRedirectNotice() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  if (!next) return null;
  return <p className="text-sm text-slate-500">You will return to {next} after signing in.</p>;
}
