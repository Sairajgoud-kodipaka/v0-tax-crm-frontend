import nodemailer from 'nodemailer';

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS !== undefined &&
      process.env.MAIL_FROM?.trim(),
  );
}

export async function sendSmtpMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Display name shown in From field, e.g. employee's name */
  fromName?: string;
  /** Email address for Reply-To header, e.g. employee's email */
  replyTo?: string;
}): Promise<void> {
  if (!isSmtpConfigured()) return;

  const port = Number(process.env.SMTP_PORT ?? '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS ?? '',
    },
  });

  const baseFrom = process.env.MAIL_FROM!.trim();
  const from = opts.fromName ? `"${opts.fromName}" <${baseFrom}>` : baseFrom;

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });
}
