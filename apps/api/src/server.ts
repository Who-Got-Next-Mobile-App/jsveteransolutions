import "./env.js";
import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.API_PORT ?? 4000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`JSVS API listening on http://localhost:${port}`);
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is not set. Using local docker default if configured.");
  }
});
