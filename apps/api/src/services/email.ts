import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});

function fromAddress() {
  return process.env.SES_FROM_EMAIL ?? "noreply@jsveteransolutions.com";
}

function portalBaseUrl() {
  return process.env.APP_BASE_URL ?? "https://jsveteransolutions.com";
}

export async function sendPlainEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!input.to.trim()) return { sent: false as const, reason: "missing_recipient" };

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: fromAddress(),
        Destination: { ToAddresses: [input.to] },
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: "UTF-8" },
            Body: { Text: { Data: input.text, Charset: "UTF-8" } }
          }
        }
      })
    );
    return { sent: true as const };
  } catch (error) {
    console.error("SES send failed", error);
    return { sent: false as const, reason: "ses_error" };
  }
}

/** PHI-safe: never include message body content. */
export async function notifyProviderOfClientMessage(input: {
  providerEmail: string;
  providerName: string;
  clientName: string;
  subject: string;
  isReply: boolean;
}) {
  const link = `${portalBaseUrl()}/staff/messages`;
  const action = input.isReply ? "replied in" : "started";
  const subject = input.isReply
    ? `New client reply: ${input.subject}`
    : `New client message: ${input.subject}`;

  const text = [
    `Hi ${input.providerName},`,
    "",
    `${input.clientName} ${action} a secure portal conversation.`,
    `Subject: ${input.subject}`,
    "",
    "Message content is only available inside the Provider Portal (not emailed).",
    `Open messages: ${link}`,
    "",
    "— JS Veteran Solutions"
  ].join("\n");

  return sendPlainEmail({ to: input.providerEmail, subject, text });
}
