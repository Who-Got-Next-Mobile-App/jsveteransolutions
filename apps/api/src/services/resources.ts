import { and, desc, eq } from "drizzle-orm";
import { assignedResources, educationResources, getDb, timelineEvents } from "@vsn/db";

export async function listCatalogResources() {
  const db = getDb();
  return db.select().from(educationResources).orderBy(educationResources.title);
}

export async function listAssignedResources(clientProfileId: string) {
  const db = getDb();
  return db
    .select({
      assignment: assignedResources,
      resource: educationResources
    })
    .from(assignedResources)
    .innerJoin(educationResources, eq(assignedResources.resourceId, educationResources.id))
    .where(eq(assignedResources.clientProfileId, clientProfileId))
    .orderBy(desc(assignedResources.assignedAt));
}

export async function createResource(input: {
  slug: string;
  title: string;
  type: "article" | "video" | "pdf" | "checklist" | "template" | "faq" | "quiz" | "webinar" | "course";
  category?: string;
  description?: string;
  estimatedMinutes?: number;
  downloadableAssetUrl?: string;
}) {
  const db = getDb();
  const [created] = await db
    .insert(educationResources)
    .values({
      slug: input.slug,
      title: input.title,
      type: input.type,
      category: input.category ?? "general",
      description: input.description,
      estimatedMinutes: input.estimatedMinutes,
      downloadableAssetUrl: input.downloadableAssetUrl,
      isPublic: false,
      accessLevel: "client"
    })
    .returning();
  return created;
}

export async function assignResource(input: {
  clientProfileId: string;
  resourceId: string;
  assignedByUserId: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(assignedResources)
    .where(
      and(
        eq(assignedResources.clientProfileId, input.clientProfileId),
        eq(assignedResources.resourceId, input.resourceId)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(assignedResources)
    .values({
      clientProfileId: input.clientProfileId,
      resourceId: input.resourceId,
      assignedByUserId: input.assignedByUserId
    })
    .returning();

  const [resource] = await db
    .select()
    .from(educationResources)
    .where(eq(educationResources.id, input.resourceId))
    .limit(1);

  await db.insert(timelineEvents).values({
    clientProfileId: input.clientProfileId,
    actorUserId: input.assignedByUserId,
    eventType: "resource_assigned",
    summary: `Resource assigned: ${resource?.title ?? "Education resource"}`,
    visibleToClient: true
  });

  return created;
}

export async function updateAssignedResourceStatus(input: {
  assignmentId: string;
  clientProfileId?: string;
  status: "assigned" | "started" | "completed";
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(assignedResources)
    .where(eq(assignedResources.id, input.assignmentId))
    .limit(1);
  if (!existing) return null;
  if (input.clientProfileId && existing.clientProfileId !== input.clientProfileId) return null;

  const [updated] = await db
    .update(assignedResources)
    .set({
      status: input.status,
      completedAt: input.status === "completed" ? new Date() : null
    })
    .where(eq(assignedResources.id, input.assignmentId))
    .returning();

  return updated;
}
