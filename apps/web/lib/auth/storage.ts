import type { AuthSession } from "./types";

const SESSION_KEY = "jsvs.auth.session";
const PKCE_KEY = "jsvs.auth.pkce";

/** Browser-session only — closing the tab/window clears auth tokens. */
function sessionStore() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function loadSession(): AuthSession | null {
  const store = sessionStore();
  if (!store) return null;
  const raw = store.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  sessionStore()?.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStore()?.removeItem(SESSION_KEY);
  // Clear any legacy persistent session from earlier builds.
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function savePkceVerifier(verifier: string) {
  sessionStore()?.setItem(PKCE_KEY, verifier);
}

export function loadPkceVerifier() {
  return sessionStore()?.getItem(PKCE_KEY) ?? null;
}

export function clearPkceVerifier() {
  sessionStore()?.removeItem(PKCE_KEY);
}

const INVITE_KEY = "jsvs.provider.invite";

export function savePendingInviteToken(token: string) {
  sessionStore()?.setItem(INVITE_KEY, token);
}

export function loadPendingInviteToken() {
  return sessionStore()?.getItem(INVITE_KEY) ?? null;
}

export function clearPendingInviteToken() {
  sessionStore()?.removeItem(INVITE_KEY);
}
