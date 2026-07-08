import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const localMode = process.env.LOCAL_FILE_STORAGE === "true" || !process.env.AWS_ACCESS_KEY_ID;

export function isLocalFileStorage() {
  return localMode;
}

export function localStorageRoot() {
  return process.env.LOCAL_STORAGE_PATH ?? join(process.cwd(), ".local-uploads");
}

export async function saveLocalUpload(key: string, body: Buffer) {
  const fullPath = join(localStorageRoot(), key);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, body);
  return fullPath;
}

export function localUploadUrl(key: string) {
  return `http://localhost:${process.env.API_PORT ?? 4000}/local-uploads/${encodeURIComponent(key)}`;
}
