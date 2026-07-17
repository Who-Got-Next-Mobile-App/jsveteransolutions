import { and, desc, eq } from "drizzle-orm";
import { getDb, messageEntries, messageThreads, timelineEvents } from "@vsn/db";

export async function listThreadsForClient(clientProfileId: string) {
  const db = getDb();
  return db
    .select()
    .from(messageThreads)
    .where(eq(messageThreads.clientProfileId, clientProfileId))
    .orderBy(desc(messageThreads.updatedAt));
}

export async function listAllThreads() {
  const db = getDb();
  return db.select().from(messageThreads).orderBy(desc(messageThreads.updatedAt));
}

export async function getThreadWithMessages(threadId: string, clientProfileId?: string) {
  const db = getDb();
  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, threadId)).limit(1);
  if (!thread) return null;
  if (clientProfileId && thread.clientProfileId !== clientProfileId) return null;

  const messages = await db
    .select()
    .from(messageEntries)
    .where(eq(messageEntries.threadId, threadId))
    .orderBy(messageEntries.createdAt);

  return { thread, messages };
}

export async function createThread(input: {
  clientProfileId: string;
  subject: string;
  body: string;
  senderUserId: string;
  participantUserIds?: string[];
}) {
  const db = getDb();
  const participants = Array.from(new Set([input.senderUserId, ...(input.participantUserIds ?? [])]));

  const [thread] = await db
    .insert(messageThreads)
    .values({
      clientProfileId: input.clientProfileId,
      subject: input.subject,
      participantUserIds: participants
    })
    .returning();

  const [message] = await db
    .insert(messageEntries)
    .values({
      threadId: thread.id,
      senderUserId: input.senderUserId,
      body: input.body,
      containsPhi: true
    })
    .returning();

  await db
    .update(messageThreads)
    .set({ updatedAt: new Date() })
    .where(eq(messageThreads.id, thread.id));

  await db.insert(timelineEvents).values({
    clientProfileId: input.clientProfileId,
    actorUserId: input.senderUserId,
    eventType: "message_thread_created",
    summary: `Secure message started: ${input.subject}`,
    visibleToClient: true
  });

  return { thread, message };
}

export async function replyToThread(input: {
  threadId: string;
  body: string;
  senderUserId: string;
  clientProfileId?: string;
}) {
  const db = getDb();
  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, input.threadId)).limit(1);
  if (!thread) return null;
  if (input.clientProfileId && thread.clientProfileId !== input.clientProfileId) return null;
  if (thread.isClosed) throw new Error("Thread is closed");

  const participants = Array.from(
    new Set([...(Array.isArray(thread.participantUserIds) ? (thread.participantUserIds as string[]) : []), input.senderUserId])
  );

  const [message] = await db
    .insert(messageEntries)
    .values({
      threadId: thread.id,
      senderUserId: input.senderUserId,
      body: input.body,
      containsPhi: true
    })
    .returning();

  const [updatedThread] = await db
    .update(messageThreads)
    .set({ participantUserIds: participants, updatedAt: new Date() })
    .where(eq(messageThreads.id, thread.id))
    .returning();

  return { thread: updatedThread, message };
}

export async function setThreadClosed(threadId: string, isClosed: boolean, actorUserId: string) {
  const db = getDb();
  const [updated] = await db
    .update(messageThreads)
    .set({ isClosed, updatedAt: new Date() })
    .where(eq(messageThreads.id, threadId))
    .returning();

  if (updated) {
    await db.insert(timelineEvents).values({
      clientProfileId: updated.clientProfileId,
      actorUserId,
      eventType: isClosed ? "message_thread_closed" : "message_thread_reopened",
      summary: isClosed ? `Message thread closed: ${updated.subject}` : `Message thread reopened: ${updated.subject}`,
      visibleToClient: true
    });
  }

  return updated;
}

export async function findThreadForClient(threadId: string, clientProfileId: string) {
  const db = getDb();
  const [thread] = await db
    .select()
    .from(messageThreads)
    .where(and(eq(messageThreads.id, threadId), eq(messageThreads.clientProfileId, clientProfileId)))
    .limit(1);
  return thread ?? null;
}
