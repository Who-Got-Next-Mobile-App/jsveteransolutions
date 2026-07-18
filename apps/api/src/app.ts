import "./env.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware, requireRoles } from "./middleware/auth";
import {
  completeDocumentUpload,
  createDocumentUpload,
  getDocumentDownloadUrl,
  getStaffDocumentDownloadUrl,
  listDocumentsForClientProfile,
  listDocumentsForProfile,
  listDocumentsForReview,
  updateDocumentStatus
} from "./services/documents";
import {
  bootstrapClientProfile,
  claimClientProfile,
  findProfileByUserId,
  getProfileById,
  getStaffStats,
  listActiveProviders,
  listProfilesForStaff,
  listUnassignedProfiles,
  reassignClientProfile,
  setAcceptingClients,
  staffCanAccessProfile,
  updateProfileStage,
  upsertUserFromAuth
} from "./services/users";
import {
  createProviderInvite,
  listProviderInvites,
  previewInvite,
  redeemProviderInvite,
  revokeProviderInvite
} from "./services/invites";
import {
  assertClientProfileExists,
  countOpenTasks,
  createTask,
  listClientTasks,
  listStaffTasks,
  updateTask
} from "./services/tasks";
import {
  createThread,
  getThreadWithMessages,
  listAllThreads,
  listThreadsForClient,
  replyToThread,
  setThreadClosed
} from "./services/messages";
import {
  bookAvailabilitySlot,
  cancelAppointment,
  cancelAvailabilitySlot,
  createAvailabilitySlot,
  listClientAppointments,
  listOpenAvailability,
  listStaffAppointments,
  listStaffAvailability
} from "./services/consultations";
import {
  assignResource,
  createResource,
  listAssignedResources,
  listCatalogResources,
  updateAssignedResourceStatus
} from "./services/resources";
import {
  createReferralSubmission,
  listReferralSubmissions,
  updateReferralSubmissionStatus
} from "./services/referrals";
import { getDb, timelineEvents } from "@vsn/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://jsveteransolutions-web.vercel.app",
  "https://jsveteransolutions.com",
  "https://www.jsveteransolutions.com"
];

const claimStageSchema = z.enum([
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
]);

const consultationTypeSchema = z.enum([
  "initial_consultation",
  "follow_up_consultation",
  "medical_record_review",
  "evidence_organization",
  "medical_summary_service",
  "workshop",
  "academy_session"
]);

export function createApp() {
  const app = new Hono();

  const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((value) => value.trim()).filter(Boolean) ?? DEFAULT_CORS_ORIGINS;
  const allowDevHeaders = process.env.DEV_AUTH_BYPASS === "true";

  app.use(
    "*",
    cors({
      origin: corsOrigins,
      allowHeaders: allowDevHeaders
        ? ["Content-Type", "Authorization", "X-User-Sub", "X-User-Email", "X-User-Role", "X-User-Name"]
        : ["Content-Type", "Authorization"],
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

  app.get("/v1/invites/:token", async (c) => {
    const preview = await previewInvite(c.req.param("token"));
    if (!preview) return c.json({ error: "Invite not found" }, 404);
    return c.json({ invite: preview });
  });

  const referralCategorySchema = z.enum(["realtor", "attorney", "educator", "developer", "other"]);
  const referralStatusSchema = z.enum(["pending", "reviewed", "archived"]);
  const referralCommunicationSchema = z.enum(["text", "call", "either"]);
  const referralContactSchema = z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(7).max(32)
  });

  app.post("/v1/referrals", async (c) => {
    const raw = await c.req.json();
    if (JSON.stringify(raw).length > 20_000) {
      return c.json({ error: "Submission is too large" }, 413);
    }

    const body = z
      .object({
        businessName: z.string().trim().min(2).max(200),
        category: referralCategorySchema,
        contacts: z.array(referralContactSchema).min(1).max(2),
        communicationPreference: referralCommunicationSchema.default("either"),
        communicationNotes: z.string().trim().max(1000).optional(),
        services: z.array(z.string().trim().min(1).max(200)).min(1).max(40),
        serviceArea: z.string().trim().min(2).max(1000),
        email: z.string().trim().email().max(320).optional().or(z.literal("")),
        websiteUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
        notes: z.string().trim().max(2000).optional(),
        disclaimerAccepted: z.literal(true)
      })
      .parse(raw);

    const submission = await createReferralSubmission({
      businessName: body.businessName,
      category: body.category,
      contacts: body.contacts,
      communicationPreference: body.communicationPreference,
      communicationNotes: body.communicationNotes,
      services: body.services,
      serviceArea: body.serviceArea,
      email: body.email || undefined,
      websiteUrl: body.websiteUrl || undefined,
      notes: body.notes
    });

    return c.json({ submission }, 201);
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
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profiles = await listProfilesForStaff(user.role, user.id);
    return c.json({ profiles });
  });

  app.get("/v1/staff/stats", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const stats = await getStaffStats(user.role, user.id);
    const openTasks = await countOpenTasks();
    return c.json({ stats: { ...stats, openTasks } });
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

  app.get("/v1/profiles/:id", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);

    const db = getDb();
    const timeline = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.clientProfileId, profile.id))
      .orderBy(timelineEvents.createdAt);

    return c.json({ profile, timeline });
  });

  app.patch("/v1/profiles/:id/stage", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ stage: claimStageSchema }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);

    const updated = await updateProfileStage(profile.id, body.stage, user.id);
    return c.json({ profile: updated });
  });

  app.get("/v1/profiles/:id/documents", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);
    const items = await listDocumentsForClientProfile(profile.id);
    return c.json({ documents: items });
  });

  app.get("/v1/staff/documents", requireRoles("owner", "assistant"), async (c) => {
    const documentsList = await listDocumentsForReview();
    return c.json({ documents: documentsList });
  });

  app.patch("/v1/staff/documents/:id/status", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        status: z.enum(["uploaded", "under_review", "additional_info_requested", "complete", "archived"]),
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

    const updated = await completeDocumentUpload(c.req.param("id"), profile.id, user.id);
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

  app.get("/v1/tasks", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    return c.json({ tasks: await listClientTasks(profile.id) });
  });

  app.patch("/v1/tasks/:id", requireRoles("client"), async (c) => {
    const body = z
      .object({
        status: z.enum(["open", "in_progress", "waiting_on_client", "done", "cancelled"]).optional()
      })
      .parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);

    const updated = await updateTask({
      taskId: c.req.param("id"),
      clientProfileId: profile.id,
      status: body.status,
      actorUserId: user.id
    });
    if (!updated) return c.json({ error: "Task not found" }, 404);
    return c.json({ task: updated });
  });

  app.get("/v1/staff/tasks", requireRoles("owner", "assistant"), async (c) => {
    const clientProfileId = c.req.query("clientProfileId");
    return c.json({ tasks: await listStaffTasks(clientProfileId) });
  });

  app.post("/v1/staff/clients/:id/tasks", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        title: z.string().min(1).max(300),
        description: z.string().max(4000).optional(),
        visibility: z.enum(["internal", "client_visible"]).optional(),
        dueAt: z.string().datetime().optional(),
        assignedToUserId: z.string().uuid().optional()
      })
      .parse(await c.req.json());

    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await assertClientProfileExists(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);

    const task = await createTask({
      clientProfileId: profile.id,
      title: body.title,
      description: body.description,
      visibility: body.visibility,
      dueAt: body.dueAt,
      createdByUserId: user.id,
      assignedToUserId: body.assignedToUserId
    });
    return c.json({ task });
  });

  app.patch("/v1/staff/tasks/:id", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        title: z.string().min(1).max(300).optional(),
        description: z.string().max(4000).optional(),
        status: z.enum(["open", "in_progress", "waiting_on_client", "done", "cancelled"]).optional()
      })
      .parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const updated = await updateTask({
      taskId: c.req.param("id"),
      title: body.title,
      description: body.description,
      status: body.status,
      actorUserId: user.id,
      allowInternal: true
    });
    if (!updated) return c.json({ error: "Task not found" }, 404);
    return c.json({ task: updated });
  });

  app.get("/v1/messages", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    return c.json({ threads: await listThreadsForClient(profile.id) });
  });

  app.get("/v1/messages/:id", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    const result = await getThreadWithMessages(c.req.param("id"), profile.id);
    if (!result) return c.json({ error: "Thread not found" }, 404);
    return c.json(result);
  });

  app.post("/v1/messages", requireRoles("client"), async (c) => {
    const body = z
      .object({
        subject: z.string().min(1).max(300),
        body: z.string().min(1).max(8000)
      })
      .parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    const result = await createThread({
      clientProfileId: profile.id,
      subject: body.subject,
      body: body.body,
      senderUserId: user.id
    });
    return c.json(result);
  });

  app.post("/v1/messages/:id/reply", requireRoles("client"), async (c) => {
    const body = z.object({ body: z.string().min(1).max(8000) }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    try {
      const result = await replyToThread({
        threadId: c.req.param("id"),
        body: body.body,
        senderUserId: user.id,
        clientProfileId: profile.id
      });
      if (!result) return c.json({ error: "Thread not found" }, 404);
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to reply" }, 400);
    }
  });

  app.get("/v1/staff/messages", requireRoles("owner", "assistant"), async (c) => {
    const clientProfileId = c.req.query("clientProfileId");
    if (clientProfileId) {
      return c.json({ threads: await listThreadsForClient(clientProfileId) });
    }
    return c.json({ threads: await listAllThreads() });
  });

  app.get("/v1/staff/messages/:id", requireRoles("owner", "assistant"), async (c) => {
    const result = await getThreadWithMessages(c.req.param("id"));
    if (!result) return c.json({ error: "Thread not found" }, 404);
    return c.json(result);
  });

  app.post("/v1/staff/clients/:id/messages", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        subject: z.string().min(1).max(300),
        body: z.string().min(1).max(8000)
      })
      .parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);

    const result = await createThread({
      clientProfileId: profile.id,
      subject: body.subject,
      body: body.body,
      senderUserId: user.id,
      participantUserIds: [profile.userAccountId]
    });
    return c.json(result);
  });

  app.post("/v1/staff/messages/:id/reply", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ body: z.string().min(1).max(8000) }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    try {
      const result = await replyToThread({
        threadId: c.req.param("id"),
        body: body.body,
        senderUserId: user.id
      });
      if (!result) return c.json({ error: "Thread not found" }, 404);
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to reply" }, 400);
    }
  });

  app.patch("/v1/staff/messages/:id", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ isClosed: z.boolean() }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const updated = await setThreadClosed(c.req.param("id"), body.isClosed, user.id);
    if (!updated) return c.json({ error: "Thread not found" }, 404);
    return c.json({ thread: updated });
  });

  app.get("/v1/availability", requireRoles("client"), async (c) => {
    return c.json({ slots: await listOpenAvailability() });
  });

  app.get("/v1/appointments", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    return c.json({ appointments: await listClientAppointments(profile.id) });
  });

  app.post("/v1/appointments", requireRoles("client"), async (c) => {
    const body = z.object({ slotId: z.string().uuid() }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    try {
      const result = await bookAvailabilitySlot({
        slotId: body.slotId,
        clientProfileId: profile.id,
        actorUserId: user.id
      });
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Booking failed" }, 400);
    }
  });

  app.patch("/v1/appointments/:id/cancel", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    const updated = await cancelAppointment({
      appointmentId: c.req.param("id"),
      clientProfileId: profile.id,
      actorUserId: user.id
    });
    if (!updated) return c.json({ error: "Appointment not found" }, 404);
    return c.json({ appointment: updated });
  });

  app.get("/v1/staff/availability", requireRoles("owner", "assistant"), async (c) => {
    return c.json({ slots: await listStaffAvailability() });
  });

  app.post("/v1/staff/availability", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        consultationType: consultationTypeSchema.default("initial_consultation"),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        notes: z.string().max(1000).optional()
      })
      .parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    try {
      const slot = await createAvailabilitySlot({
        staffUserId: user.id,
        consultationType: body.consultationType,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        notes: body.notes
      });
      return c.json({ slot });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to create slot" }, 400);
    }
  });

  app.patch("/v1/staff/availability/:id/cancel", requireRoles("owner", "assistant"), async (c) => {
    try {
      const slot = await cancelAvailabilitySlot(c.req.param("id"));
      if (!slot) return c.json({ error: "Slot not found" }, 404);
      return c.json({ slot });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to cancel slot" }, 400);
    }
  });

  app.get("/v1/staff/appointments", requireRoles("owner", "assistant"), async (c) => {
    const clientProfileId = c.req.query("clientProfileId");
    return c.json({ appointments: await listStaffAppointments(clientProfileId) });
  });

  app.patch("/v1/staff/appointments/:id/cancel", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const updated = await cancelAppointment({
      appointmentId: c.req.param("id"),
      actorUserId: user.id
    });
    if (!updated) return c.json({ error: "Appointment not found" }, 404);
    return c.json({ appointment: updated });
  });

  app.get("/v1/resources", requireRoles("client"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    const resources = await listAssignedResources(profile.id);
    return c.json({
      resources: resources.map((row) => ({
        ...row.assignment,
        resource: row.resource
      }))
    });
  });

  app.patch("/v1/resources/:id", requireRoles("client"), async (c) => {
    const body = z.object({ status: z.enum(["assigned", "started", "completed"]) }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await findProfileByUserId(user.id);
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    const updated = await updateAssignedResourceStatus({
      assignmentId: c.req.param("id"),
      clientProfileId: profile.id,
      status: body.status
    });
    if (!updated) return c.json({ error: "Resource assignment not found" }, 404);
    return c.json({ assignment: updated });
  });

  app.get("/v1/staff/resources", requireRoles("owner", "assistant"), async (c) => {
    return c.json({ resources: await listCatalogResources() });
  });

  app.post("/v1/staff/resources", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({
        slug: z.string().min(1).max(200),
        title: z.string().min(1).max(300),
        type: z.enum(["article", "video", "pdf", "checklist", "template", "faq", "quiz", "webinar", "course"]),
        category: z.string().max(120).optional(),
        description: z.string().max(4000).optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        downloadableAssetUrl: z.string().url().optional()
      })
      .parse(await c.req.json());
    const resource = await createResource(body);
    return c.json({ resource });
  });

  app.post("/v1/staff/clients/:id/resources", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ resourceId: z.string().uuid() }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);
    const assignment = await assignResource({
      clientProfileId: profile.id,
      resourceId: body.resourceId,
      assignedByUserId: user.id
    });
    return c.json({ assignment });
  });

  app.get("/v1/staff/clients/:id/resources", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const profile = await getProfileById(c.req.param("id"));
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (!staffCanAccessProfile(user.role, user.id, profile)) return c.json({ error: "Forbidden" }, 403);
    const resources = await listAssignedResources(profile.id);
    return c.json({
      resources: resources.map((row) => ({
        ...row.assignment,
        resource: row.resource
      }))
    });
  });

  app.get("/v1/staff/invites", requireRoles("owner", "assistant"), async (c) => {
    return c.json({ invites: await listProviderInvites() });
  });

  app.post("/v1/staff/invites", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ email: z.string().email() }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    try {
      const invite = await createProviderInvite({ email: body.email, invitedByUserId: user.id });
      return c.json({ invite });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to create invite" }, 400);
    }
  });

  app.post("/v1/staff/invites/:id/revoke", requireRoles("owner", "assistant"), async (c) => {
    const invite = await revokeProviderInvite(c.req.param("id"));
    if (!invite) return c.json({ error: "Invite not found" }, 404);
    return c.json({ invite });
  });

  app.post("/v1/invites/:token/redeem", async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    try {
      const result = await redeemProviderInvite({
        token: c.req.param("token"),
        userId: user.id,
        email: authUser.email,
        cognitoUsername: authUser.sub
      });
      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to redeem invite" }, 400);
    }
  });

  app.get("/v1/staff/me", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        acceptingClients: user.acceptingClients
      }
    });
  });

  app.patch("/v1/staff/me/availability", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ acceptingClients: z.boolean() }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const updated = await setAcceptingClients(user.id, body.acceptingClients);
    return c.json({ user: updated });
  });

  app.get("/v1/staff/clients/unassigned", requireRoles("owner", "assistant"), async (c) => {
    return c.json({ profiles: await listUnassignedProfiles() });
  });

  app.get("/v1/staff/providers", requireRoles("owner", "assistant"), async (c) => {
    return c.json({ providers: await listActiveProviders() });
  });

  app.get("/v1/staff/referrals", requireRoles("owner", "assistant"), async (c) => {
    const statusParam = c.req.query("status");
    const status = statusParam
      ? z.enum(["pending", "reviewed", "archived"]).parse(statusParam)
      : undefined;
    return c.json({ submissions: await listReferralSubmissions(status) });
  });

  app.patch("/v1/staff/referrals/:id", requireRoles("owner", "assistant"), async (c) => {
    const body = z
      .object({ status: z.enum(["reviewed", "archived"]) })
      .parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    const submission = await updateReferralSubmissionStatus({
      id: c.req.param("id"),
      status: body.status,
      reviewedByUserId: user.id
    });
    if (!submission) return c.json({ error: "Submission not found" }, 404);
    return c.json({ submission });
  });

  app.post("/v1/staff/clients/:id/claim", requireRoles("owner", "assistant"), async (c) => {
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    try {
      const profile = await claimClientProfile(c.req.param("id"), user.id, user.role);
      if (!profile) return c.json({ error: "Profile not found" }, 404);
      return c.json({ profile });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to claim client" }, 400);
    }
  });

  app.post("/v1/staff/clients/:id/reassign", requireRoles("owner", "assistant"), async (c) => {
    const body = z.object({ toProviderUserId: z.string().uuid() }).parse(await c.req.json());
    const authUser = c.get("user");
    const user = await upsertUserFromAuth(authUser);
    try {
      const profile = await reassignClientProfile({
        profileId: c.req.param("id"),
        toProviderUserId: body.toProviderUserId,
        actorUserId: user.id,
        actorRole: user.role
      });
      if (!profile) return c.json({ error: "Profile not found" }, 404);
      return c.json({ profile });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unable to reassign client" }, 400);
    }
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
