import { Suspense } from "react";
import { AuthGuard } from "@/components/AuthGuard";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthGuard allowedRoles={["owner", "assistant"]} portal="staff">
        {children}
      </AuthGuard>
    </Suspense>
  );
}
