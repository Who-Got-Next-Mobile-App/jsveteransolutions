import { and, desc, eq, ne } from "drizzle-orm";
import { clientProfiles, getDb, tasks, timelineEvents } from "@vsn/db";
import type { TaskStatus, TaskVisibility } from "@vsn/types";

export async function listClientTasks(clientProfileId: string) {
  const db = getDb();
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.clientProfileId, clientProfileId), eq(tasks.visibility, "client_visible")))
    .orderBy(desc(tasks.createdAt));
}

export async function listStaffTasks(clientProfileId?: string) {
  const db = getDb();
  if (clientProfileId) {
    return db.select().from(tasks).where(eq(tasks.clientProfileId, clientProfileId)).orderBy(desc(tasks.createdAt));
  }
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function createTask(input: {
  clientProfileId: string;
  title: string;
  description?: string;
  visibility?: TaskVisibility;
  status?: TaskStatus;
  dueAt?: string;
  createdByUserId: string;
  assignedToUserId?: string;
}) {
  const db = getDb();
  const [created] = await db
    .insert(tasks)
    .values({
      clientProfileId: input.clientProfileId,
      title: input.title,
      description: input.description,
      visibility: input.visibility ?? "client_visible",
      status: input.status ?? "open",
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      createdByUserId: input.createdByUserId,
      assignedToUserId: input.assignedToUserId
    })
    .returning();

  await db.insert(timelineEvents).values({
    clientProfileId: input.clientProfileId,
    actorUserId: input.createdByUserId,
    eventType: "task_created",
    summary: `Task assigned: ${input.title}`,
    visibleToClient: (input.visibility ?? "client_visible") === "client_visible"
  });

  return created;
}

export async function updateTask(input: {
  taskId: string;
  clientProfileId?: string;
  status?: TaskStatus;
  title?: string;
  description?: string;
  actorUserId: string;
  allowInternal?: boolean;
}) {
  const db = getDb();
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);
  if (!existing) return null;
  if (input.clientProfileId && existing.clientProfileId !== input.clientProfileId) return null;
  if (!input.allowInternal && existing.visibility !== "client_visible") return null;

  const completedAt =
    input.status === "done" ? new Date() : input.status && input.status !== "done" ? null : existing.completedAt;

  const [updated] = await db
    .update(tasks)
    .set({
      status: input.status ?? existing.status,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      completedAt,
      updatedAt: new Date()
    })
    .where(eq(tasks.id, input.taskId))
    .returning();

  if (updated && input.status) {
    await db.insert(timelineEvents).values({
      clientProfileId: updated.clientProfileId,
      actorUserId: input.actorUserId,
      eventType: "task_updated",
      summary: `Task marked ${input.status.replace(/_/g, " ")}: ${updated.title}`,
      visibleToClient: updated.visibility === "client_visible"
    });
  }

  return updated;
}

export async function countOpenTasks() {
  const db = getDb();
  const rows = await db.select().from(tasks).where(ne(tasks.status, "done"));
  return rows.filter((task) => task.status !== "cancelled").length;
}

export async function assertClientProfileExists(clientProfileId: string) {
  const db = getDb();
  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.id, clientProfileId)).limit(1);
  return profile ?? null;
}
