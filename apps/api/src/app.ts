import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware, requireRoles } from "./middleware/auth";
import { completeDocumentUpload, createDocumentUpload, getDocumentDownloadUrl, getStaffDocumentDownloadUrl, listDocumentsForClientProfile, listDocumentsForProfile, listDocumentsForReview, updateDocumentStatus } from "./services/documents";
import { bootstrapClientProfile, findProfileByUserId, getProfileById, getStaffStats, listProfilesForStaff, updateProfileStage, upsertUserFromAuth } from "./services/users";
import { getDb, timelineEvents } from "@vsn/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000", "http://localhost:3001"],
      allowHeaders: ["Content-Type", "Authorization", "X-User-Sub", "X-User-Email", "X-User-Role", "X-User-Name"],
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"]
    })
  );

  app.get("/health", (c) => c.json({ ok: true, service: "jsvs-api" }));

  app.put("/local-uploads/*", async (c) => {
    if (!process.env.LOCAL_FILE_STORAGE && process.env.AWS_ACCESS_KEY_ID) {
      return c.json({ error: "Not found" }, 404);
    }
    const key = c.req.path.replace("/local-uploads/", "");
    const decodedKey = decodeURIComponent(key);
    const body = Buffer.from(await c.req.arrayBuffer());
    const { saveLocalUpload } = await import("./services/local-storage");
    await saveLocalUpload(decodedKey, body);
    return c.json({ ok: true, key: decodedKey });
  });

  app.use("/v1/*", authMiddleware);

  app.post("/v1/session/bootstrap", async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile =
      user.role === "client" ? await bootstrapClientProfile(authUser, user.id) : await findProfileByUserId(user.id);

    return c.json({ user, profile });
  });

  app.get("/v1/me", async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    return c.json({ user, profile });
  });

  app.get("/v1/profiles", requireRoles("owner", "assistant"), async (c) => {
    const profiles = await listProfilesForStaff();
    return c.json({ profiles });
  });

  app.get("/v1/staff/stats", requireRoles("owner", "assistant"), async (c) => {
    const stats = await getStaffStats();
    return c.json({ stats });
  });

  app.get("/v1/profiles/:id", requireRoles("owner", "assistant"), async (c) => {
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    const db = getDb();
    const timeline = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.clientProfileId, profile.id))
      .orderBy(timelineEvents.createdAt);

    return c.json({ profile, timeline });
  });

  app.patch("/v1/profiles/:id/stage", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        stage: z.enum([
          "intake_received",
          "documents_requested",
          "records_uploaded",
          "records_under_review",
          "evidence_gaps_identified",
          "consultation_completed",
          "recommendations_provided",
          "resources_assigned",
          "follow_up_needed",
          "completed_closed"
        ])
      })
      .parse(await c.req.json());

    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const updated = await updateProfileStage(c.req.param("id"), body.stage, user.id);
    if (!updated) return c.json({ error: "Profile not found" }, 404);
    return c.json({ profile: updated });
  });

  app.get("/v1/profiles/:id/documents", requireRoles("owner", "assistant"), async (c) => {
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    const items = await listDocumentsForClientProfile(profile.id);
    return c.json({ documents: items });
  });

  app.get("/v1/profiles/me", async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    let profile = await findProfileByUserId(user.id);
    if (!profile && user.role === "client") {
      profile = await bootstrapClientProfile(authUser, user.id);
    }
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    const db = getDb();
    const timeline = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.clientProfileId, profile.id))
      .orderBy(timelineEvents.createdAt);

    return c.json({ profile, timeline });
  });

  app.patch("/v1/profiles/me/stage", requireRoles("client"), async (c) => {
    const body = z
      .object({
        stage: z.enum([
          "intake_received",
          "documents_requested",
          "records_uploaded",
          "records_under_review",
          "evidence_gaps_identified",
          "consultation_completed",
          "recommendations_provided",
          "resources_assigned",
          "follow_up_needed",
          "completed_closed"
        ])
      })
      .parse(await c.req.json());

    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    if (authUser.role === "client" && user.id !== profile.userAccountId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const updated = await updateProfileStage(profile.id, body.stage, user.id);
    return c.json({ profile: updated });
  });

  app.get("/v1/staff/documents", requireRoles("owner", "assistant"), async (c) => {
    const documentsList = await listDocumentsForReview();
    return c.json({ documents: documentsList });
  });

  app.patch("/v1/staff/documents/:id/status", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        status: z.enum([
          "uploaded",
          "under_review",
          "additional_info_requested",
          "complete",
          "archived"
        ]),
        reviewNotes: z.string().max(2000).optional()
      })
      .parse(await c.req.json());

    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const updated = await updateDocumentStatus({
      documentId: c.req.param("id"),
      status: body.status,
      reviewNotes: body.reviewNotes,
      actorUserId: user.id
    });
    if (!updated) return c.json({ error: "Document not found" }, 404);
    return c.json({ document: updated });
  });

  app.get("/v1/staff/documents/:id/download", requireRoles("owner", "assistant"), async (c) => {
    const result = await getStaffDocumentDownloadUrl(c.req.param("id"));
    if (!result) return c.json({ error: "Document not found" }, 404);
    return c.json(result);
  });

  app.get("/v1/documents", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    const items = await listDocumentsForProfile(profile.id);
    return c.json({ documents: items });
  });

  app.post("/v1/documents/presign", requireRoles("client"), async (c) => {
    const body = z
      .object({
        type: z.enum([
          "va_decision_letter",
          "dbq",
          "service_treatment_record",
          "private_medical_record",
          "nexus_letter",
          "lay_statement",
          "buddy_statement",
          "imaging_or_labs",
          "personal_injury_record",
          "attorney_letter",
          "intake_attachment",
          "other"
        ]),
        title: z.string().min(1).max(300),
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().positive(),
        originalFilename: z.string().min(1).max(255),
        serviceDate: z.string().optional()
      })
      .parse(await c.req.json());

    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    let profile = await findProfileByUserId(user.id);
    if (!profile) profile = await bootstrapClientProfile(authUser, user.id);

    try {
      const result = await createDocumentUpload({
        clientProfileId: profile.id,
        uploadedByUserId: user.id,
        type: body.type,
        title: body.title,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        originalFilename: body.originalFilename,
        serviceDate: body.serviceDate
      });
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Upload failed" }, 400);
    }
  });

  app.post("/v1/documents/:id/complete", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    const documentId = c.req.param("id");
    const updated = await completeDocumentUpload(documentId, profile.id, user.id);
    if (!updated) return c.json({ error: "Document not found" }, 404);
    return c.json({ document: updated });
  });

  app.get("/v1/documents/:id/download", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    const result = await getDocumentDownloadUrl(c.req.param("id"), profile.id);
    if (!result) return c.json({ error: "Document not found" }, 404);
    return c.json(result);
  });

  app.onError((err, c) => {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation failed", details: err.flatten() }, 400);
    }
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
