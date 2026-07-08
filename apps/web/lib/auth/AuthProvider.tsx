"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { setApiSession } from "@/lib/auth/api-session";
import { cognitoLogoutUrl } from "@/lib/auth/cognito";
import { clearSession, loadSession, saveSession } from "@/lib/auth/storage";
import type { AuthSession, DevPersona, PortalKind } from "@/lib/auth/types";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  loginWithDevPersona: (persona: DevPersona, redirectTo?: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((next: AuthSession | null) => {
    setSession(next);
    setApiSession(next);
    if (next) saveSession(next);
    else clearSession();
  }, []);

  const bootstrap = useCallback(async () => {
    if (!session) return;
    await apiFetch("/v1/session/bootstrap", { method: "POST", body: "{}" });
  }, [session]);

  const loginWithDevPersona = useCallback(
    async (persona: DevPersona, redirectTo?: string) => {
      const next: AuthSession = {
        mode: "dev",
        sub: persona.sub,
        email: persona.email,
        role: persona.role,
        displayName: persona.name
      };
      applySession(next);
      setApiSession(next);
      await apiFetch("/v1/session/bootstrap", { method: "POST", body: "{}" });
      if (redirectTo) window.location.href = redirectTo;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    const logoutUrl = session?.mode === "cognito" ? cognitoLogoutUrl() : null;
    applySession(null);
    if (logoutUrl) {
      window.location.href = logoutUrl;
      return;
    }
    window.location.href = "/login";
  }, [applySession, session?.mode]);

  useEffect(() => {
    const stored = loadSession();
    applySession(stored);
    setLoading(false);
  }, [applySession]);

  useEffect(() => {
    if (session?.mode === "cognito") {
      bootstrap().catch(() => undefined);
    }
  }, [bootstrap, session?.mode]);

  const value = useMemo(
    () => ({ session, loading, loginWithDevPersona, logout, bootstrap }),
    [session, loading, loginWithDevPersona, logout, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function portalHomeForRole(role: AuthSession["role"], requested?: PortalKind | null) {
  if (requested === "staff" || role === "owner" || role === "assistant") return "/staff";
  return "/portal";
}
