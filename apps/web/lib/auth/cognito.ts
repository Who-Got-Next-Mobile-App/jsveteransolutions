import { clearPkceVerifier, savePkceState } from "./storage";
import type { AuthSession } from "./types";

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(verifierBytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(digest));
  return { verifier, challenge };
}

export function isCognitoConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID &&
      process.env.NEXT_PUBLIC_COGNITO_DOMAIN
  );
}

/** Always use apex in production so www redirects don't break OAuth state. */
export function cognitoRedirectUri() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "jsveteransolutions.com" || host === "www.jsveteransolutions.com") {
    return "https://jsveteransolutions.com/auth/callback";
  }
  return `${window.location.origin}/auth/callback`;
}

async function persistPkce(verifier: string, redirectUri: string) {
  savePkceState({ verifier, redirectUri });
  // httpOnly cookie survives storage wipes and is used by the server token route.
  const response = await fetch("/api/auth/pkce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ verifier, redirectUri })
  });
  if (!response.ok) {
    throw new Error("Unable to start secure sign-in. Please try again.");
  }
}

type HostedLoginOptions = {
  /** Cognito Managed Login path. Signup must use /signup — screen_hint is not supported. */
  path?: "oauth2/authorize" | "signup";
};

async function beginHostedLogin(options: HostedLoginOptions = {}) {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) throw new Error("Cognito is not configured");

  // Canonicalize off www before Cognito round-trip.
  if (typeof window !== "undefined" && window.location.hostname === "www.jsveteransolutions.com") {
    const next = new URL(window.location.href);
    next.hostname = "jsveteransolutions.com";
    window.location.replace(next.toString());
    return;
  }

  const { verifier, challenge } = await createPkcePair();
  const redirectUri = cognitoRedirectUri();
  await persistPkce(verifier, redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });

  const path = options.path ?? "oauth2/authorize";
  window.location.href = `https://${domain}/${path}?${params.toString()}`;
}

export async function startCognitoLogin() {
  await beginHostedLogin({ path: "oauth2/authorize" });
}

export async function startCognitoSignup() {
  // Managed Login signup page — same OAuth/PKCE params as authorize.
  await beginHostedLogin({ path: "signup" });
}

const exchangeByCode = new Map<string, Promise<AuthSession>>();

export async function completeCognitoLogin(code: string): Promise<AuthSession> {
  const existing = exchangeByCode.get(code);
  if (existing) return existing;

  const promise = (async () => {
    const response = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code, redirectUri: cognitoRedirectUri() })
    });

    clearPkceVerifier();

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
      mode?: AuthSession["mode"];
      sub?: string;
      email?: string;
      role?: AuthSession["role"];
      displayName?: string;
      idToken?: string;
      accessToken?: string;
      expiresAt?: number;
    };

    if (!response.ok) {
      const detail = payload.detail ? ` (${payload.detail})` : "";
      throw new Error(`${payload.error ?? "Sign-in failed"}${detail}`);
    }

    if (!payload.sub || !payload.email || !payload.role || !payload.idToken || !payload.accessToken) {
      throw new Error("Sign-in response was incomplete");
    }

    return {
      mode: "cognito",
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      displayName: payload.displayName ?? payload.email.split("@")[0],
      idToken: payload.idToken,
      accessToken: payload.accessToken,
      expiresAt: payload.expiresAt
    } satisfies AuthSession;
  })();

  exchangeByCode.set(code, promise);
  try {
    return await promise;
  } catch (error) {
    exchangeByCode.delete(code);
    throw error;
  }
}

export function cognitoLogoutUrl() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) return null;

  const logoutUri =
    typeof window !== "undefined" &&
    (window.location.hostname === "jsveteransolutions.com" ||
      window.location.hostname === "www.jsveteransolutions.com")
      ? "https://jsveteransolutions.com"
      : typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri
  });

  return `https://${domain}/logout?${params.toString()}`;
}

/** Opens Cognito Managed Login passkey registration after an authenticated session. */
export function cognitoManagePasskeyUrl() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: cognitoRedirectUri()
  });

  return `https://${domain}/passkeys/add?${params.toString()}`;
}
