import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.API_PORT ?? 4000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`JSVS API listening on http://localhost:${port}`);
});
