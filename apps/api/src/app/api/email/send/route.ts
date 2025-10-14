import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../email/mailer';
import { renderTemplate, EmailTemplateId } from '../../../email/templates';

export const runtime = 'nodejs';

/**
 * POST /api/email/send
 * {
 *   "to": "user@example.com" | ["a@b.com","c@d.com"],
 *   "template": "welcome_user",
 *   "context": { "fullName": "Nguyen Van A", "role": "student" }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, template, context } = body as {
      to?: unknown;
      template?: unknown;
      context?: unknown;
    };

    // Basic validation
    const errors: string[] = [];
    if (!to) errors.push('Missing to');
    const toValid =
      typeof to === 'string' ||
      (Array.isArray(to) && to.every((x) => typeof x === 'string'));
    if (to && !toValid) errors.push('Invalid to (must be string or string[])');

    const allowedTemplates: EmailTemplateId[] = [
      'test',
      'password_changed',
      'reset_password_admin',
      'welcome_user',
    ];
    if (!template) errors.push('Missing template');
    if (template && !allowedTemplates.includes(template as EmailTemplateId)) {
      errors.push('Invalid template');
    }

    if (context && (typeof context !== 'object' || Array.isArray(context))) {
      errors.push('Context must be an object');
    }

    if (errors.length) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    if (!to) {
      return NextResponse.json({ error: 'Missing to' }, { status: 400 });
    }
    if (!template) {
      return NextResponse.json({ error: 'Missing template' }, { status: 400 });
    }

    let subject: string; let html: string; let text: string | undefined;
    try {
      const rendered = renderTemplate(template as EmailTemplateId, (context as Record<string, unknown>) || {});
      subject = rendered.subject;
      html = rendered.html;
      text = rendered.text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return NextResponse.json({ error: 'Template render error', detail: msg }, { status: 400 });
    }

  const typedTo = to as string | string[];
  const info = await sendEmail({ to: typedTo, subject, html, text });
  const sent = info as { messageId?: string };
    return NextResponse.json({ success: true, messageId: sent.messageId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
