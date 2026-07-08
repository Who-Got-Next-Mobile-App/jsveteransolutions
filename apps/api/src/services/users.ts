import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { clientProfiles, documents, getDb, timelineEvents } from "@vsn/db";
import type { ClaimStage } from "@vsn/types";
import type { AuthUser } from "../types";

export async function findUserBySub(sub: string) {
  const db = getDb();
  const [user] = await db.select().from(userAccounts).where(eq(userAccounts.cognitoSub, sub)).limit(1);
  return user ?? null;
}

export async function upsertUserFromAuth(authUser: AuthUser) {
  const db = getDb();
  const existing = await findUserBySub(authUser.sub);

  if (existing) {
    const [updated] = await db
      .update(userAccounts)
      .set({
        email: authUser.email,
        displayName: authUser.displayName,
        role: authUser.role === "owner" || authUser.role === "assistant" ? authUser.role : "client",
        lastLoginAt: new Date()
      })
      .where(eq(userAccounts.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(userAccounts)
    .values({
      cognitoSub: authUser.sub,
      email: authUser.email,
      displayName: authUser.displayName,
      role: authUser.role === "owner" || authUser.role === "assistant" ? authUser.role : "client",
      lastLoginAt: new Date()
    })
    .returning();

  return created;
}

export async function findProfileByUserId(userAccountId: string) {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(clientProfiles)
    .where(eq(clientProfiles.userAccountId, userAccountId))
    .limit(1);
  return profile ?? null;
}

export async function bootstrapClientProfile(authUser: AuthUser, userAccountId: string) {
  const db = getDb();
  const existing = await findProfileByUserId(userAccountId);
  if (existing) return existing;

  const nameParts = authUser.displayName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "Client";
  const lastName = nameParts.slice(1).join(" ") || "User";

  const [profile] = await db
    .insert(clientProfiles)
    .values({
      userAccountId,
      firstName,
      lastName,
      email: authUser.email,
      militaryService: {},
      claimedConditions: [],
      tags: []
    })
    .returning();

  await db.insert(timelineEvents).values({
    clientProfileId: profile.id,
    actorUserId: userAccountId,
    eventType: "account_created",
    summary: "Client portal account created",
    visibleToClient: true
  });

  return profile;
}

export async function listProfilesForStaff() {
  const db = getDb();
  return db.select().from(clientProfiles).orderBy(desc(clientProfiles.updatedAt));
}

export async function getProfileById(profileId: string) {
  const db = getDb();
  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.id, profileId)).limit(1);
  return profile ?? null;
}

export async function updateProfileStage(profileId: string, stage: ClaimStage, actorUserId: string) {
  const db = getDb();
  const [updated] = await db
    .update(clientProfiles)
    .set({ currentStage: stage, updatedAt: new Date(), lastPortalActivityAt: new Date() })
    .where(eq(clientProfiles.id, profileId))
    .returning();

  if (!updated) return null;

  await db.insert(timelineEvents).values({
    clientProfileId: profileId,
    actorUserId,
    eventType: "stage_updated",
    summary: `Claim stage updated to ${stage.replace(/_/g, " ")}`,
    visibleToClient: true
  });

  return updated;
}

export async function getStaffStats() {
  const db = getDb();
  const [clientCount] = await db
    .select({ value: count() })
    .from(clientProfiles)
    .where(sql`${clientProfiles.currentStage} != 'completed_closed'`);

  const [reviewCount] = await db
    .select({ value: count() })
    .from(documents)
    .where(inArray(documents.status, ["uploaded", "under_review", "additional_info_requested"]));

  const [urgentCount] = await db
    .select({ value: count() })
    .from(documents)
    .where(eq(documents.status, "additional_info_requested"));

  return {
    activeClients: clientCount?.value ?? 0,
    documentsToReview: reviewCount?.value ?? 0,
    urgentDocuments: urgentCount?.value ?? 0
  };
}
