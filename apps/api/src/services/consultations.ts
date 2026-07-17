import { and, desc, eq, gt } from "drizzle-orm";
import { availabilitySlots, consultations, getDb, timelineEvents } from "@vsn/db";
import type { ConsultationType } from "@vsn/types";

export async function listOpenAvailability() {
  const db = getDb();
  return db
    .select()
    .from(availabilitySlots)
    .where(and(eq(availabilitySlots.status, "open"), gt(availabilitySlots.startsAt, new Date())))
    .orderBy(availabilitySlots.startsAt);
}

export async function listStaffAvailability() {
  const db = getDb();
  return db.select().from(availabilitySlots).orderBy(desc(availabilitySlots.startsAt));
}

export async function createAvailabilitySlot(input: {
  staffUserId: string;
  consultationType: ConsultationType;
  startsAt: string;
  endsAt: string;
  notes?: string;
}) {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!(startsAt < endsAt)) throw new Error("Slot end time must be after start time");

  const db = getDb();
  const [created] = await db
    .insert(availabilitySlots)
    .values({
      staffUserId: input.staffUserId,
      consultationType: input.consultationType,
      startsAt,
      endsAt,
      notes: input.notes,
      status: "open"
    })
    .returning();
  return created;
}

export async function cancelAvailabilitySlot(slotId: string) {
  const db = getDb();
  const [existing] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, slotId)).limit(1);
  if (!existing) return null;
  if (existing.status === "booked") throw new Error("Cannot cancel a booked slot");

  const [updated] = await db
    .update(availabilitySlots)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(availabilitySlots.id, slotId))
    .returning();
  return updated;
}

export async function bookAvailabilitySlot(input: {
  slotId: string;
  clientProfileId: string;
  actorUserId: string;
}) {
  const db = getDb();

  const [updatedSlot] = await db
    .update(availabilitySlots)
    .set({ status: "booked", updatedAt: new Date() })
    .where(and(eq(availabilitySlots.id, input.slotId), eq(availabilitySlots.status, "open")))
    .returning();

  if (!updatedSlot) throw new Error("Slot is not available");
  if (updatedSlot.startsAt <= new Date()) {
    await db
      .update(availabilitySlots)
      .set({ status: "open", updatedAt: new Date() })
      .where(eq(availabilitySlots.id, updatedSlot.id));
    throw new Error("Slot is in the past");
  }

  const [appointment] = await db
    .insert(consultations)
    .values({
      clientProfileId: input.clientProfileId,
      availabilitySlotId: updatedSlot.id,
      staffUserId: updatedSlot.staffUserId,
      type: updatedSlot.consultationType,
      scheduledStartAt: updatedSlot.startsAt,
      scheduledEndAt: updatedSlot.endsAt,
      bookingSource: "portal",
      attendanceStatus: "scheduled"
    })
    .returning();

  await db.insert(timelineEvents).values({
    clientProfileId: input.clientProfileId,
    actorUserId: input.actorUserId,
    eventType: "appointment_booked",
    summary: `Appointment booked for ${updatedSlot.startsAt.toISOString()}`,
    visibleToClient: true
  });

  return { slot: updatedSlot, appointment };
}

export async function listClientAppointments(clientProfileId: string) {
  const db = getDb();
  return db
    .select()
    .from(consultations)
    .where(eq(consultations.clientProfileId, clientProfileId))
    .orderBy(desc(consultations.scheduledStartAt));
}

export async function listStaffAppointments(clientProfileId?: string) {
  const db = getDb();
  if (clientProfileId) {
    return db
      .select()
      .from(consultations)
      .where(eq(consultations.clientProfileId, clientProfileId))
      .orderBy(desc(consultations.scheduledStartAt));
  }
  return db.select().from(consultations).orderBy(desc(consultations.scheduledStartAt));
}

export async function cancelAppointment(input: {
  appointmentId: string;
  clientProfileId?: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [existing] = await db.select().from(consultations).where(eq(consultations.id, input.appointmentId)).limit(1);
  if (!existing) return null;
  if (input.clientProfileId && existing.clientProfileId !== input.clientProfileId) return null;

  const [updated] = await db
    .update(consultations)
    .set({ attendanceStatus: "cancelled" })
    .where(eq(consultations.id, input.appointmentId))
    .returning();

  if (existing.availabilitySlotId) {
    await db
      .update(availabilitySlots)
      .set({ status: "open", updatedAt: new Date() })
      .where(eq(availabilitySlots.id, existing.availabilitySlotId));
  }

  await db.insert(timelineEvents).values({
    clientProfileId: existing.clientProfileId,
    actorUserId: input.actorUserId,
    eventType: "appointment_cancelled",
    summary: "Appointment cancelled",
    visibleToClient: true
  });

  return updated;
}
