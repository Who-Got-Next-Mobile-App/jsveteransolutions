import type { AuthSession } from "./types";

const SESSION_KEY = "jsvs.auth.session";
const PKCE_KEY = "jsvs.auth.pkce";
const PKCE_COOKIE = "jsvs_pkce";

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

export interface PkceState {
  verifier: string;
  redirectUri: string;
}

function cookieDomainAttribute() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  // Share PKCE across apex and www so Cognito callbacks don't lose login state.
  if (host === "jsveteransolutions.com" || host.endsWith(".jsveteransolutions.com")) {
    return "; Domain=.jsveteransolutions.com";
  }
  return "";
}

function writePkceCookie(value: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 20; // 20 minutes covers Managed Login + passkey prompts
  document.cookie = `${PKCE_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure${cookieDomainAttribute()}`;
}

function readPkceCookie() {
  if (typeof document === "undefined") return null;
  const prefix = `${PKCE_COOKIE}=`;
  const match = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

function clearPkceCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${PKCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure${cookieDomainAttribute()}`;
  // Also clear host-only variants that may have been written earlier.
  document.cookie = `${PKCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

export function savePkceState(state: PkceState) {
  const raw = JSON.stringify(state);
  sessionStore()?.setItem(PKCE_KEY, raw);
  writePkceCookie(raw);
}

export function loadPkceState(): PkceState | null {
  const raw = sessionStore()?.getItem(PKCE_KEY) ?? readPkceCookie();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PkceState;
    if (!parsed?.verifier || !parsed?.redirectUri) return null;
    return parsed;
  } catch {
    // Legacy builds stored a bare verifier string.
    if (raw.length > 16 && !raw.startsWith("{")) {
      return {
        verifier: raw,
        redirectUri: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : ""
      };
    }
    return null;
  }
}

/** @deprecated Prefer savePkceState — kept for call-site clarity during transition. */
export function savePkceVerifier(verifier: string) {
  savePkceState({
    verifier,
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : ""
  });
}

export function loadPkceVerifier() {
  return loadPkceState()?.verifier ?? null;
}

export function clearPkceVerifier() {
  sessionStore()?.removeItem(PKCE_KEY);
  clearPkceCookie();
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
