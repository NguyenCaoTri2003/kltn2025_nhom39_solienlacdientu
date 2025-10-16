import nodemailer, { createTransport } from 'nodemailer';

// Use loose typing to avoid build issues with nodemailer Transporter namespace type
let cachedTransporter: any | null = null;

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
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransporter;
}

export async function sendEmail(opts: SendEmailOptions) {
  const transporter = getTransporter();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER!;
  const info = await transporter.sendMail({
    from,
    ...opts,
  });
  return info;
}
