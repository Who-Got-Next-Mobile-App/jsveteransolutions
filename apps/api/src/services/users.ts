import { and, asc, count, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { clientProfiles, documents, getDb, timelineEvents, userAccounts } from "@vsn/db";
import type { ClaimStage, UserRole } from "@vsn/types";
import type { AuthUser } from "../types";

export async function findUserBySub(sub: string) {
  const db = getDb();
  const [user] = await db.select().from(userAccounts).where(eq(userAccounts.cognitoSub, sub)).limit(1);
  return user ?? null;
}

export async function findUserById(userId: string) {
  const db = getDb();
  const [user] = await db.select().from(userAccounts).where(eq(userAccounts.id, userId)).limit(1);
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
        role: authUser.role === "owner" || authUser.role === "assistant" ? authUser.role : existing.role === "assistant" || existing.role === "owner" ? existing.role : "client",
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

export async function promoteUserToAssistant(userId: string) {
  const db = getDb();
  const [updated] = await db
    .update(userAccounts)
    .set({ role: "assistant" })
    .where(eq(userAccounts.id, userId))
    .returning();
  return updated ?? null;
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

export async function assignClientToLeastLoadedProvider(profileId: string) {
  const db = getDb();

  const providers = await db
    .select()
    .from(userAccounts)
    .where(
      and(
        inArray(userAccounts.role, ["assistant", "owner"]),
        eq(userAccounts.isActive, true),
        eq(userAccounts.acceptingClients, true)
      )
    )
    .orderBy(asc(userAccounts.lastClientAssignedAt), asc(userAccounts.createdAt));

  if (!providers.length) return null;

  const openCounts = await db
    .select({
      providerId: clientProfiles.assignedAssistantUserId,
      value: count()
    })
    .from(clientProfiles)
    .where(
      and(
        ne(clientProfiles.currentStage, "completed_closed"),
        sql`${clientProfiles.assignedAssistantUserId} IS NOT NULL`
      )
    )
    .groupBy(clientProfiles.assignedAssistantUserId);

  const countByProvider = new Map(openCounts.map((row) => [row.providerId, Number(row.value)]));

  let selected = providers[0]!;
  let selectedCount = countByProvider.get(selected.id) ?? 0;

  for (const provider of providers.slice(1)) {
    const providerCount = countByProvider.get(provider.id) ?? 0;
    if (providerCount < selectedCount) {
      selected = provider;
      selectedCount = providerCount;
      continue;
    }
    if (providerCount > selectedCount) continue;

    const selectedLast = selected.lastClientAssignedAt?.getTime() ?? 0;
    const providerLast = provider.lastClientAssignedAt?.getTime() ?? 0;
    if (providerLast < selectedLast) {
      selected = provider;
      selectedCount = providerCount;
    }
  }

  const assignment =
    selected.role === "owner"
      ? { assignedAssistantUserId: selected.id, assignedOwnerUserId: selected.id }
      : { assignedAssistantUserId: selected.id };

  const [updated] = await db
    .update(clientProfiles)
    .set({
      ...assignment,
      updatedAt: new Date()
    })
    .where(eq(clientProfiles.id, profileId))
    .returning();

  await db
    .update(userAccounts)
    .set({ lastClientAssignedAt: new Date() })
    .where(eq(userAccounts.id, selected.id));

  await db.insert(timelineEvents).values({
    clientProfileId: profileId,
    actorUserId: selected.id,
    eventType: "client_auto_assigned",
    summary: `Auto-assigned to provider ${selected.displayName} (least open caseload)`,
    visibleToClient: false
  });

  return updated ?? null;
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

  const assigned = await assignClientToLeastLoadedProvider(profile.id);
  return assigned ?? profile;
}

export async function listProfilesForStaff(role: UserRole, staffUserId: string) {
  const db = getDb();
  if (role === "owner") {
    return db.select().from(clientProfiles).orderBy(desc(clientProfiles.updatedAt));
  }

  return db
    .select()
    .from(clientProfiles)
    .where(
      or(eq(clientProfiles.assignedAssistantUserId, staffUserId), eq(clientProfiles.assignedOwnerUserId, staffUserId))
    )
    .orderBy(desc(clientProfiles.updatedAt));
}

export async function listUnassignedProfiles() {
  const db = getDb();
  return db
    .select()
    .from(clientProfiles)
    .where(and(isNull(clientProfiles.assignedAssistantUserId), isNull(clientProfiles.assignedOwnerUserId)))
    .orderBy(desc(clientProfiles.createdAt));
}

export async function listActiveProviders() {
  const db = getDb();
  return db
    .select({
      id: userAccounts.id,
      email: userAccounts.email,
      displayName: userAccounts.displayName,
      role: userAccounts.role,
      acceptingClients: userAccounts.acceptingClients,
      lastClientAssignedAt: userAccounts.lastClientAssignedAt,
      isActive: userAccounts.isActive
    })
    .from(userAccounts)
    .where(and(inArray(userAccounts.role, ["assistant", "owner"]), eq(userAccounts.isActive, true)))
    .orderBy(asc(userAccounts.displayName));
}

export async function getProfileById(profileId: string) {
  const db = getDb();
  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.id, profileId)).limit(1);
  return profile ?? null;
}

export function staffCanAccessProfile(
  role: UserRole,
  staffUserId: string,
  profile: { assignedOwnerUserId: string | null; assignedAssistantUserId: string | null }
) {
  if (role === "owner") return true;
  return profile.assignedOwnerUserId === staffUserId || profile.assignedAssistantUserId === staffUserId;
}

export async function claimClientProfile(profileId: string, providerUserId: string, actorRole: UserRole) {
  const db = getDb();
  const profile = await getProfileById(profileId);
  if (!profile) return null;

  const isUnassigned = !profile.assignedAssistantUserId && !profile.assignedOwnerUserId;
  if (!isUnassigned && actorRole !== "owner") {
    throw new Error("Client is already assigned");
  }

  const [updated] = await db
    .update(clientProfiles)
    .set({
      assignedAssistantUserId: providerUserId,
      assignedOwnerUserId: actorRole === "owner" ? providerUserId : profile.assignedOwnerUserId,
      updatedAt: new Date()
    })
    .where(eq(clientProfiles.id, profileId))
    .returning();

  await db
    .update(userAccounts)
    .set({ lastClientAssignedAt: new Date() })
    .where(eq(userAccounts.id, providerUserId));

  await db.insert(timelineEvents).values({
    clientProfileId: profileId,
    actorUserId: providerUserId,
    eventType: "client_claimed",
    summary: "Client claimed by provider",
    visibleToClient: false
  });

  return updated ?? null;
}

export async function reassignClientProfile(input: {
  profileId: string;
  toProviderUserId: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const db = getDb();
  const profile = await getProfileById(input.profileId);
  if (!profile) return null;

  if (input.actorRole !== "owner" && !staffCanAccessProfile(input.actorRole, input.actorUserId, profile)) {
    throw new Error("Forbidden");
  }

  const target = await findUserById(input.toProviderUserId);
  if (!target || (target.role !== "assistant" && target.role !== "owner") || !target.isActive) {
    throw new Error("Target provider is not available");
  }

  const [updated] = await db
    .update(clientProfiles)
    .set({
      assignedAssistantUserId: target.id,
      assignedOwnerUserId: target.role === "owner" ? target.id : profile.assignedOwnerUserId,
      updatedAt: new Date()
    })
    .where(eq(clientProfiles.id, input.profileId))
    .returning();

  await db
    .update(userAccounts)
    .set({ lastClientAssignedAt: new Date() })
    .where(eq(userAccounts.id, target.id));

  await db.insert(timelineEvents).values({
    clientProfileId: input.profileId,
    actorUserId: input.actorUserId,
    eventType: "client_reassigned",
    summary: `Client reassigned to ${target.displayName}`,
    visibleToClient: false
  });

  return updated ?? null;
}

export async function setAcceptingClients(userId: string, acceptingClients: boolean) {
  const db = getDb();
  const [updated] = await db
    .update(userAccounts)
    .set({ acceptingClients })
    .where(eq(userAccounts.id, userId))
    .returning();
  return updated ?? null;
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

export async function getStaffStats(role: UserRole, staffUserId: string) {
  const db = getDb();

  const myClientsFilter =
    role === "owner"
      ? sql`${clientProfiles.currentStage} != 'completed_closed'`
      : and(
          ne(clientProfiles.currentStage, "completed_closed"),
          or(
            eq(clientProfiles.assignedAssistantUserId, staffUserId),
            eq(clientProfiles.assignedOwnerUserId, staffUserId)
          )
        );

  const [clientCount] = await db.select({ value: count() }).from(clientProfiles).where(myClientsFilter);

  const [unassignedCount] = await db
    .select({ value: count() })
    .from(clientProfiles)
    .where(and(isNull(clientProfiles.assignedAssistantUserId), isNull(clientProfiles.assignedOwnerUserId)));

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
    unassignedClients: unassignedCount?.value ?? 0,
    documentsToReview: reviewCount?.value ?? 0,
    urgentDocuments: urgentCount?.value ?? 0
  };
}
