import { getDb, referralSubmissions } from "@vsn/db";
import { desc, eq } from "drizzle-orm";

export type ReferralCategory = "realtor" | "attorney" | "educator" | "developer" | "other";
export type ReferralStatus = "pending" | "reviewed" | "archived";
export type ReferralCommunicationPreference = "text" | "call" | "either";

export interface ReferralContactInput {
  name: string;
  phone: string;
}

export interface CreateReferralInput {
  businessName: string;
  category: ReferralCategory;
  contacts: ReferralContactInput[];
  communicationPreference: ReferralCommunicationPreference;
  communicationNotes?: string;
  services: string[];
  serviceArea: string;
  email?: string;
  websiteUrl?: string;
  notes?: string;
}

function serialize(row: typeof referralSubmissions.$inferSelect) {
  return {
    id: row.id,
    businessName: row.businessName,
    category: row.category,
    contacts: row.contacts ?? [],
    communicationPreference: row.communicationPreference,
    communicationNotes: row.communicationNotes ?? undefined,
    services: row.services ?? [],
    serviceArea: row.serviceArea,
    email: row.email ?? undefined,
    websiteUrl: row.websiteUrl ?? undefined,
    notes: row.notes ?? undefined,
    disclaimerAcceptedAt: row.disclaimerAcceptedAt.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    reviewedByUserId: row.reviewedByUserId ?? undefined
  };
}

export async function createReferralSubmission(input: CreateReferralInput) {
  const db = getDb();
  const [row] = await db
    .insert(referralSubmissions)
    .values({
      businessName: input.businessName.trim(),
      category: input.category,
      contacts: input.contacts.map((contact) => ({
        name: contact.name.trim(),
        phone: contact.phone.trim()
      })),
      communicationPreference: input.communicationPreference,
      communicationNotes: input.communicationNotes?.trim() || null,
      services: input.services.map((service) => service.trim()).filter(Boolean),
      serviceArea: input.serviceArea.trim(),
      email: input.email?.trim() || null,
      websiteUrl: input.websiteUrl?.trim() || null,
      notes: input.notes?.trim() || null,
      disclaimerAcceptedAt: new Date(),
      status: "pending"
    })
    .returning();

  return serialize(row);
}

export async function listReferralSubmissions(status?: ReferralStatus) {
  const db = getDb();
  const rows = status
    ? await db
        .select()
        .from(referralSubmissions)
        .where(eq(referralSubmissions.status, status))
        .orderBy(desc(referralSubmissions.createdAt))
    : await db.select().from(referralSubmissions).orderBy(desc(referralSubmissions.createdAt));

  return rows.map(serialize);
}

export async function updateReferralSubmissionStatus(input: {
  id: string;
  status: Exclude<ReferralStatus, "pending">;
  reviewedByUserId: string;
}) {
  const db = getDb();
  const [row] = await db
    .update(referralSubmissions)
    .set({
      status: input.status,
      reviewedAt: new Date(),
      reviewedByUserId: input.reviewedByUserId
    })
    .where(eq(referralSubmissions.id, input.id))
    .returning();

  return row ? serialize(row) : null;
}
