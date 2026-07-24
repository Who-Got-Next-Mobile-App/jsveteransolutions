import type { NextResponse } from "next/server";

export const PKCE_HTTPONLY_COOKIE = "jsvs_pkce_http";

export type PkceCookiePayload = {
  verifier: string;
  redirectUri: string;
};

export function productionCookieDomain(hostHeader: string | null) {
  const host = (hostHeader ?? "").split(":")[0]?.toLowerCase();
  if (host === "jsveteransolutions.com" || host.endsWith(".jsveteransolutions.com")) {
    return ".jsveteransolutions.com";
  }
  return undefined;
}

export function setPkceHttpOnlyCookie(
  response: NextResponse,
  payload: PkceCookiePayload,
  hostHeader: string | null
) {
  response.cookies.set(PKCE_HTTPONLY_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 20,
    domain: productionCookieDomain(hostHeader)
  });
}

export function clearPkceHttpOnlyCookie(response: NextResponse, hostHeader: string | null) {
  response.cookies.set(PKCE_HTTPONLY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    domain: productionCookieDomain(hostHeader)
  });
  // Clear host-only copy if a prior response omitted Domain.
  response.cookies.set(PKCE_HTTPONLY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function parsePkceCookie(raw: string | undefined): PkceCookiePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PkceCookiePayload;
    if (!parsed?.verifier || !parsed?.redirectUri) return null;
    return parsed;
  } catch {
    return null;
  }
}
