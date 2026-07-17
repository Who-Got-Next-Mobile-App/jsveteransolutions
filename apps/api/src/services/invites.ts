import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, providerInvites } from "@vsn/db";
import { promoteUserToAssistant } from "./users";
import { addUserToGroup, removeUserFromGroup } from "./cognito-admin";

const INVITE_TTL_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export async function createProviderInvite(input: { email: string; invitedByUserId: string }) {
  const db = getDb();
  const email = normalizeEmail(input.email);
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [existing] = await db
    .select()
    .from(providerInvites)
    .where(and(eq(providerInvites.email, email), eq(providerInvites.status, "pending")))
    .limit(1);

  if (existing && existing.expiresAt > new Date()) {
    throw new Error("A pending invite already exists for this email");
  }

  if (existing) {
    await db
      .update(providerInvites)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(providerInvites.id, existing.id));
  }

  const [created] = await db
    .insert(providerInvites)
    .values({
      email,
      token,
      invitedByUserId: input.invitedByUserId,
      expiresAt,
      status: "pending"
    })
    .returning();

  return created;
}

export async function listProviderInvites() {
  const db = getDb();
  await db.execute(sql`
    UPDATE provider_invites
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW()
  `);

  return db.select().from(providerInvites).orderBy(desc(providerInvites.createdAt));
}

export async function revokeProviderInvite(inviteId: string) {
  const db = getDb();
  const [updated] = await db
    .update(providerInvites)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(and(eq(providerInvites.id, inviteId), eq(providerInvites.status, "pending")))
    .returning();
  return updated ?? null;
}

export async function getInviteByToken(token: string) {
  const db = getDb();
  const [invite] = await db.select().from(providerInvites).where(eq(providerInvites.token, token)).limit(1);
  if (!invite) return null;

  if (invite.status === "pending" && invite.expiresAt <= new Date()) {
    const [expired] = await db
      .update(providerInvites)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(providerInvites.id, invite.id))
      .returning();
    return expired ?? invite;
  }

  return invite;
}

export async function previewInvite(token: string) {
  const invite = await getInviteByToken(token);
  if (!invite) return null;

  return {
    emailMasked: maskEmail(invite.email),
    status: invite.status,
    expiresAt: invite.expiresAt,
    valid: invite.status === "pending" && invite.expiresAt > new Date()
  };
}

export async function redeemProviderInvite(input: {
  token: string;
  userId: string;
  email: string;
  cognitoUsername: string;
}) {
  const invite = await getInviteByToken(input.token);
  if (!invite) throw new Error("Invite not found");
  if (invite.status !== "pending") throw new Error("Invite is no longer valid");
  if (invite.expiresAt <= new Date()) throw new Error("Invite has expired");

  const email = normalizeEmail(input.email);
  if (email !== normalizeEmail(invite.email)) {
    throw new Error("Signed-in email does not match invite");
  }

  if (process.env.DEV_AUTH_BYPASS !== "true") {
    await addUserToGroup(input.cognitoUsername, "assistant");
    try {
      await removeUserFromGroup(input.cognitoUsername, "client");
    } catch {
      // User may not be in client group yet
    }
  }

  const promoted = await promoteUserToAssistant(input.userId);
  if (!promoted) throw new Error("Unable to promote user");

  const db = getDb();
  const [updated] = await db
    .update(providerInvites)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
      acceptedUserId: input.userId,
      updatedAt: new Date()
    })
    .where(eq(providerInvites.id, invite.id))
    .returning();

  return { invite: updated, user: promoted };
}
