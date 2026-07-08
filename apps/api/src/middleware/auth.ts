import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { Context, Next } from "hono";
import type { UserRole } from "@vsn/types";
import type { AuthUser } from "../types";

const devBypass = process.env.DEV_AUTH_BYPASS === "true";

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) return null;
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id",
      clientId
    });
  }
  return verifier;
}

function roleFromGroups(groups: string[] = []): UserRole {
  if (groups.includes("owner")) return "owner";
  if (groups.includes("assistant")) return "assistant";
  if (groups.includes("client")) return "client";
  return "client";
}

export async function authMiddleware(c: Context, next: Next) {
  if (devBypass) {
    const sub = c.req.header("x-user-sub") ?? "dev-client-001";
    const email = c.req.header("x-user-email") ?? "client@example.com";
    const role = (c.req.header("x-user-role") ?? "client") as UserRole;
    const displayName = c.req.header("x-user-name") ?? "Dev Client";
    c.set("user", { sub, email, role, displayName });
    await next();
    return;
  }

  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice("Bearer ".length);
  const jwtVerifier = getVerifier();
  if (!jwtVerifier) {
    return c.json({ error: "Auth not configured" }, 500);
  }

  try {
    const payload = await jwtVerifier.verify(token);
    const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
    const email = (payload.email as string | undefined) ?? "unknown@example.com";
    const displayName = (payload.name as string | undefined) ?? email.split("@")[0];

    c.set("user", {
      sub: payload.sub,
      email,
      role: roleFromGroups(groups),
      displayName
    });
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}
