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

  await transporter.sendMail({
    from: process.env.MAIL_FROM!.trim(),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
