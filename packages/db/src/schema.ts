import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["client", "assistant", "owner"]);
export const claimStageEnum = pgEnum("claim_stage", [
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
export const documentTypeEnum = pgEnum("document_type", [
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
]);
export const documentStatusEnum = pgEnum("document_status", [
  "pending_upload",
  "uploaded",
  "under_review",
  "additional_info_requested",
  "complete",
  "archived"
]);

export const userAccounts = pgTable("user_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  cognitoSub: varchar("cognito_sub", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  role: userRoleEnum("role").notNull().default("client"),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true })
});

export const clientProfiles = pgTable("client_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userAccountId: uuid("user_account_id")
    .notNull()
    .references(() => userAccounts.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  preferredName: varchar("preferred_name", { length: 100 }),
  dateOfBirth: varchar("date_of_birth", { length: 10 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  address: jsonb("address"),
  emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 32 }),
  militaryService: jsonb("military_service").notNull().default({}),
  claimHistorySummary: text("claim_history_summary"),
  claimedConditions: jsonb("claimed_conditions").notNull().default([]),
  currentStage: claimStageEnum("current_stage").notNull().default("intake_received"),
  assignedOwnerUserId: uuid("assigned_owner_user_id").references(() => userAccounts.id),
  assignedAssistantUserId: uuid("assigned_assistant_user_id").references(() => userAccounts.id),
  intakeCompletedAt: timestamp("intake_completed_at", { withTimezone: true }),
  lastPortalActivityAt: timestamp("last_portal_activity_at", { withTimezone: true }),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientProfileId: uuid("client_profile_id")
    .notNull()
    .references(() => clientProfiles.id, { onDelete: "cascade" }),
  uploadedByUserId: uuid("uploaded_by_user_id")
    .notNull()
    .references(() => userAccounts.id),
  type: documentTypeEnum("type").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  s3Key: varchar("s3_key", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 200 }).notNull(),
  sizeBytes: integer("size_bytes"),
  checksum: varchar("checksum", { length: 128 }),
  serviceDate: varchar("service_date", { length: 10 }),
  status: documentStatusEnum("status").notNull().default("pending_upload"),
  reviewNotes: text("review_notes"),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientProfileId: uuid("client_profile_id")
    .notNull()
    .references(() => clientProfiles.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => userAccounts.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata"),
  visibleToClient: boolean("visible_to_client").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const intakeSubmissions = pgTable("intake_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientProfileId: uuid("client_profile_id")
    .notNull()
    .references(() => clientProfiles.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  answers: jsonb("answers").notNull().default({}),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
