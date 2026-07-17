import type { AuthSession } from "./types";

const SESSION_KEY = "jsvs.auth.session";
const PKCE_KEY = "jsvs.auth.pkce";

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
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
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function savePkceVerifier(verifier: string) {
  window.sessionStorage.setItem(PKCE_KEY, verifier);
}

export function loadPkceVerifier() {
  return window.sessionStorage.getItem(PKCE_KEY);
}

export function clearPkceVerifier() {
  window.sessionStorage.removeItem(PKCE_KEY);
}

const INVITE_KEY = "jsvs.provider.invite";

export function savePendingInviteToken(token: string) {
  window.sessionStorage.setItem(INVITE_KEY, token);
}

export function loadPendingInviteToken() {
  return window.sessionStorage.getItem(INVITE_KEY);
}

export function clearPendingInviteToken() {
  window.sessionStorage.removeItem(INVITE_KEY);
}
