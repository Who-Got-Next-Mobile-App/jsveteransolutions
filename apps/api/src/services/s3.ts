import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { isLocalFileStorage, localUploadUrl } from "./local-storage";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });

export function getDocumentsBucket() {
  return process.env.DOCUMENTS_BUCKET ?? "jsvs-documents-local";
}

export function buildDocumentKey(clientProfileId: string, documentType: string, filename: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `clients/${clientProfileId}/documents/${documentType}/${yyyy}/${mm}/${randomUUID()}-${safeName}`;
}

export async function createUploadPresignedUrl(input: {
  key: string;
  mimeType: string;
  sizeBytes: number;
}) {
  if (isLocalFileStorage()) {
    return localUploadUrl(input.key);
  }

  const command = new PutObjectCommand({
    Bucket: getDocumentsBucket(),
    Key: input.key,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return uploadUrl;
}

export async function createDownloadPresignedUrl(key: string) {
  if (isLocalFileStorage()) {
    return localUploadUrl(key);
  }

  const command = new GetObjectCommand({
    Bucket: getDocumentsBucket(),
    Key: key
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
}
