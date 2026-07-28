import { eq, inArray } from "drizzle-orm";
import { clientProfiles, getDb, userAccounts } from "@vsn/db";
import { notifyProviderOfClientMessage } from "./email";

function displayName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "A client";
}

/**
 * Email the client's assigned provider(s) when the client sends a portal message.
 * Falls back to owner accounts if the client is unassigned.
 * Never includes message body (PHI stays in-portal).
 */
export async function notifyProvidersOfClientMessage(input: {
  clientProfileId: string;
  subject: string;
  isReply: boolean;
}) {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(clientProfiles)
    .where(eq(clientProfiles.id, input.clientProfileId))
    .limit(1);
  if (!profile) return;

  const recipientIds = Array.from(
    new Set(
      [profile.assignedAssistantUserId, profile.assignedOwnerUserId].filter(
        (id): id is string => Boolean(id)
      )
    )
  );

  let recipients =
    recipientIds.length > 0
      ? await db
          .select({
            id: userAccounts.id,
            email: userAccounts.email,
            displayName: userAccounts.displayName,
            role: userAccounts.role,
            isActive: userAccounts.isActive
          })
          .from(userAccounts)
          .where(inArray(userAccounts.id, recipientIds))
      : [];

  // Unassigned clients: notify active owners so the message is not missed.
  if (!recipients.length) {
    recipients = await db
      .select({
        id: userAccounts.id,
        email: userAccounts.email,
        displayName: userAccounts.displayName,
        role: userAccounts.role,
        isActive: userAccounts.isActive
      })
      .from(userAccounts)
      .where(eq(userAccounts.role, "owner"));
  }

  const clientName = displayName(profile.firstName, profile.lastName);
  const seen = new Set<string>();

  await Promise.all(
    recipients
      .filter((user) => user.isActive && user.email && !seen.has(user.email.toLowerCase()))
      .map(async (user) => {
        seen.add(user.email.toLowerCase());
        await notifyProviderOfClientMessage({
          providerEmail: user.email,
          providerName: user.displayName || "Provider",
          clientName,
          subject: input.subject,
          isReply: input.isReply
        });
      })
  );
}
