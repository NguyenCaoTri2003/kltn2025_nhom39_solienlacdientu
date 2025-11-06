import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export async function sendEmailViaSendGrid(opts: SendEmailOptions) {
  const from = process.env.FROM_EMAIL!;
  const { to, subject, html, text, cc, bcc, replyTo } = opts;

  const msg = {
    from,
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    replyTo,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(`[sendEmailViaSendGrid] ✅ Sent to ${to}`);
    return response;
  } catch (error: any) {
    console.error("[sendEmailViaSendGrid] ❌ Error:", error.response?.body || error);
    throw new Error(`SendGrid send failed: ${error.message}`);
  }
}
