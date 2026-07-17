import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

function isLambda() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadLocalEnv() {
  if (isLambda()) return;

  try {
    const apiRoot = dirname(fileURLToPath(import.meta.url));
    config({ path: join(apiRoot, "../.env") });
    config({ path: join(apiRoot, "../../../.env") });
    loadEnvFile(join(apiRoot, "../.env"));
  } catch {
    // import.meta may be unavailable in some bundled targets
  }
}

loadLocalEnv();
