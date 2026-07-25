import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearPkceHttpOnlyCookie,
  parsePkceCookie,
  PKCE_HTTPONLY_COOKIE
} from "@/lib/auth/pkce-cookie";
import { displayNameFromClaims } from "@/lib/person-name";

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

export async function POST(request: Request) {
  const host = request.headers.get("host");

  let body: { code?: string; redirectUri?: string };
  try {
    body = (await request.json()) as { code?: string; redirectUri?: string };
  } catch {
    return NextResponse.json({ error: "Invalid token request" }, { status: 400 });
  }

  if (!body.code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!domain || !clientId) {
    return NextResponse.json({ error: "Cognito is not configured on the server" }, { status: 500 });
  }

  const store = await cookies();
  const state = parsePkceCookie(store.get(PKCE_HTTPONLY_COOKIE)?.value);
  if (!state?.verifier) {
    const response = NextResponse.json(
      {
        error:
          "Sign-in session expired or was blocked. Close extra tabs, then start sign-in again from jsveteransolutions.com."
      },
      { status: 400 }
    );
    clearPkceHttpOnlyCookie(response, host);
    return response;
  }

  const redirectUri = body.redirectUri || state.redirectUri;

  const tokenResponse = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code: body.code,
      redirect_uri: redirectUri,
      code_verifier: state.verifier
    })
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text().catch(() => "");
    const response = NextResponse.json(
      {
        error: "Cognito token exchange failed",
        detail: detail.slice(0, 300)
      },
      { status: 400 }
    );
    clearPkceHttpOnlyCookie(response, host);
    return response;
  }

  const tokens = (await tokenResponse.json()) as {
    id_token: string;
    access_token: string;
    expires_in: number;
  };

  const payload = decodeJwtPayload(tokens.id_token);
  const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
  const email = (payload.email as string | undefined) ?? "unknown@example.com";
  const displayName = displayNameFromClaims({
    name: payload.name as string | undefined,
    givenName: payload.given_name as string | undefined,
    familyName: payload.family_name as string | undefined,
    email
  });

  const response = NextResponse.json({
    mode: "cognito",
    sub: payload.sub as string,
    email,
    role: roleFromGroups(groups),
    displayName,
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000
  });
  clearPkceHttpOnlyCookie(response, host);
  return response;
}
