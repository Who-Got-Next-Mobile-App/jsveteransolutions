import { clearPkceVerifier, loadPkceVerifier, savePkceVerifier } from "./storage";
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

export function cognitoRedirectUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

export async function startCognitoLogin() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) throw new Error("Cognito is not configured");

  const { verifier, challenge } = await createPkcePair();
  savePkceVerifier(verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: cognitoRedirectUri(),
    code_challenge: challenge,
    code_challenge_method: "S256"
  });

  window.location.href = `https://${domain}/oauth2/authorize?${params.toString()}`;
}

export async function startCognitoSignup() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) throw new Error("Cognito is not configured");

  const { verifier, challenge } = await createPkcePair();
  savePkceVerifier(verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: cognitoRedirectUri(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    screen_hint: "signup"
  });

  window.location.href = `https://${domain}/oauth2/authorize?${params.toString()}`;
}

function roleFromGroups(groups: string[] = []) {
  if (groups.includes("owner")) return "owner" as const;
  if (groups.includes("assistant")) return "assistant" as const;
  return "client" as const;
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");
  if (!payload) throw new Error("Invalid token");
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return JSON.parse(atob(padded)) as Record<string, unknown>;
}

export async function completeCognitoLogin(code: string): Promise<AuthSession> {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const verifier = loadPkceVerifier();
  if (!domain || !clientId || !verifier) throw new Error("Cognito login state missing");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: cognitoRedirectUri(),
    code_verifier: verifier
  });

  const response = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  clearPkceVerifier();

  if (!response.ok) {
    throw new Error("Cognito token exchange failed");
  }

  const tokens = (await response.json()) as {
    id_token: string;
    access_token: string;
    expires_in: number;
  };

  const payload = decodeJwtPayload(tokens.id_token);
  const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
  const email = (payload.email as string | undefined) ?? "unknown@example.com";
  const displayName = (payload.name as string | undefined) ?? email.split("@")[0];

  return {
    mode: "cognito",
    sub: payload.sub as string,
    email,
    role: roleFromGroups(groups),
    displayName,
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000
  };
}

export function cognitoLogoutUrl() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  });

  return `https://${domain}/logout?${params.toString()}`;
}
