import { sendEmail } from "@/lib/email/mailer";

const fallbackAppUrl =
  process.env.NEXTAUTH_URL ??
  process.env.APP_BASE_URL ??
  "http://localhost:3000";

export async function sendScholarInvitationEmail(params: {
  recipientEmail: string;
  firstName: string;
  tenantName: string;
  temporaryPassword: string;
}) {
  const subject = `Your ${params.tenantName} Research X account`;
  const loginUrl = fallbackAppUrl;

  const text = `Hi ${params.firstName},

You have been invited to join ${params.tenantName} on Research X.

Sign in using the credentials below and complete your scholar profile:

Email: ${params.recipientEmail}
Temporary password: ${params.temporaryPassword}

Log in at: ${loginUrl}

For security, please change your password after signing in.

Thanks,
${params.tenantName} Research X`;

  const html = `
    <p>Hi ${params.firstName},</p>
    <p>You have been invited to join <strong>${params.tenantName}</strong> on Research X.</p>
    <p>Sign in using the credentials below and complete your scholar profile:</p>
    <ul>
      <li><strong>Email:</strong> ${params.recipientEmail}</li>
      <li><strong>Temporary password:</strong> ${params.temporaryPassword}</li>
    </ul>
    <p><a href="${loginUrl}">${loginUrl}</a></p>
    <p>For security, please change your password after signing in.</p>
    <p>Thanks,<br/>${params.tenantName} Research X</p>
  `;

  await sendEmail({
    to: params.recipientEmail,
    subject,
    text,
    html,
  });
}
