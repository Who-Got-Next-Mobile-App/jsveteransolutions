import { NextResponse } from "next/server";
import { setPkceHttpOnlyCookie } from "@/lib/auth/pkce-cookie";

export async function POST(request: Request) {
  let body: { verifier?: string; redirectUri?: string };
  try {
    body = (await request.json()) as { verifier?: string; redirectUri?: string };
  } catch {
    return NextResponse.json({ error: "Invalid PKCE payload" }, { status: 400 });
  }

  if (!body.verifier || !body.redirectUri) {
    return NextResponse.json({ error: "verifier and redirectUri are required" }, { status: 400 });
  }

  if (body.verifier.length < 43 || body.verifier.length > 128) {
    return NextResponse.json({ error: "Invalid PKCE verifier" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  setPkceHttpOnlyCookie(
    response,
    { verifier: body.verifier, redirectUri: body.redirectUri },
    request.headers.get("host")
  );
  return response;
}
