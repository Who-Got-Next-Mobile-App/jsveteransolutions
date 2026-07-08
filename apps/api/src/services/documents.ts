import { and, desc, eq, inArray } from "drizzle-orm";
import { clientProfiles, documents, getDb, timelineEvents } from "@vsn/db";
import type { DocumentStatus, DocumentType } from "@vsn/types";
import { buildDocumentKey, createDownloadPresignedUrl, createUploadPresignedUrl } from "./s3";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const maxUploadBytes = 25 * 1024 * 1024;

export async function listDocumentsForProfile(clientProfileId: string) {
  const db = getDb();
  return db
    .select()
    .from(documents)
    .where(eq(documents.clientProfileId, clientProfileId))
    .orderBy(desc(documents.createdAt));
}

export async function createDocumentUpload(input: {
  clientProfileId: string;
  uploadedByUserId: string;
  type: DocumentType;
  title: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  serviceDate?: string;
}) {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new Error("Unsupported file type");
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > maxUploadBytes) {
    throw new Error("Invalid file size");
  }

  const db = getDb();
  const s3Key = buildDocumentKey(input.clientProfileId, input.type, input.originalFilename);

  const [record] = await db
    .insert(documents)
    .values({
      clientProfileId: input.clientProfileId,
      uploadedByUserId: input.uploadedByUserId,
      type: input.type,
      title: input.title,
      s3Key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      serviceDate: input.serviceDate,
      status: "pending_upload"
    })
    .returning();

  const uploadUrl = await createUploadPresignedUrl({
    key: s3Key,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes
  });

  return { record, uploadUrl };
}

export async function completeDocumentUpload(documentId: string, clientProfileId: string, actorUserId: string) {
  const db = getDb();
  const [updated] = await db
    .update(documents)
    .set({ status: "under_review", updatedAt: new Date() })
    .where(and(eq(documents.id, documentId), eq(documents.clientProfileId, clientProfileId)))
    .returning();

  if (!updated) return null;

  await db.insert(timelineEvents).values({
    clientProfileId,
    actorUserId,
    eventType: "document_uploaded",
    summary: `Document uploaded: ${updated.title}`,
    visibleToClient: true
  });

  return updated;
}

export async function getDocumentDownloadUrl(documentId: string, clientProfileId: string) {
  const db = getDb();
  const [record] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.clientProfileId, clientProfileId)))
    .limit(1);

  if (!record || record.status === "pending_upload") return null;

  const downloadUrl = await createDownloadPresignedUrl(record.s3Key);
  return { record, downloadUrl };
}

const reviewQueueStatuses: DocumentStatus[] = ["uploaded", "under_review", "additional_info_requested"];

export async function listDocumentsForReview() {
  const db = getDb();
  const rows = await db
    .select({
      document: documents,
      clientFirstName: clientProfiles.firstName,
      clientLastName: clientProfiles.lastName,
      clientProfileId: clientProfiles.id
    })
    .from(documents)
    .innerJoin(clientProfiles, eq(documents.clientProfileId, clientProfiles.id))
    .where(inArray(documents.status, reviewQueueStatuses))
    .orderBy(desc(documents.createdAt));

  return rows.map((row) => ({
    ...row.document,
    clientName: `${row.clientFirstName} ${row.clientLastName}`
  }));
}

export async function listDocumentsForClientProfile(clientProfileId: string) {
  return listDocumentsForProfile(clientProfileId);
}

export async function getDocumentById(documentId: string) {
  const db = getDb();
  const [record] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  return record ?? null;
}

export async function updateDocumentStatus(input: {
  documentId: string;
  status: DocumentStatus;
  reviewNotes?: string;
  actorUserId: string;
}) {
  const db = getDb();
  const existing = await getDocumentById(input.documentId);
  if (!existing) return null;

  const [updated] = await db
    .update(documents)
    .set({
      status: input.status,
      reviewNotes: input.reviewNotes ?? existing.reviewNotes,
      updatedAt: new Date()
    })
    .where(eq(documents.id, input.documentId))
    .returning();

  await db.insert(timelineEvents).values({
    clientProfileId: existing.clientProfileId,
    actorUserId: input.actorUserId,
    eventType: "document_reviewed",
    summary: `Document "${existing.title}" marked ${input.status.replace(/_/g, " ")}`,
    visibleToClient: true
  });

  return updated;
}

export async function getStaffDocumentDownloadUrl(documentId: string) {
  const record = await getDocumentById(documentId);
  if (!record || record.status === "pending_upload") return null;

  const downloadUrl = await createDownloadPresignedUrl(record.s3Key);
  return { record, downloadUrl };
}
