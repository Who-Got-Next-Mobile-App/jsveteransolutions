import { Suspense } from "react";
import { AuthGuard } from "@/components/AuthGuard";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthGuard allowedRoles={["client"]} portal="client">
        {children}
      </AuthGuard>
    </Suspense>
  );
}
