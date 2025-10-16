import { createTransport } from 'nodemailer';

let cachedTransporter: unknown | null = null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP environment variables missing');
  }
  cachedTransporter = createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransporter;
}

type MinimalTransporter = { sendMail: (opts: Record<string, unknown>) => Promise<unknown> };

export async function sendEmail(opts: SendEmailOptions) {
  const transporter = getTransporter() as unknown as MinimalTransporter;
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER!;
  const info = await transporter.sendMail({
    from,
    ...opts,
  });
  return info;
}
