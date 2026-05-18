import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/service-role-client';
import type { Database } from '@/lib/supabase/database.types';
import { buildNotificationEmailPortalUrl } from '@/lib/email/portal-link';
import { isSmtpConfigured, sendSmtpMail } from '@/lib/email/smtp-mailer';
import {
  buildTemplate,
  templateIdForClientStage,
  type EmailTemplateId,
  type TemplateVars,
} from '@/lib/email/templates/catalog';
import { buildEmailBodies } from '@/lib/email/templates/html-shell';
import type { UserRole } from '@/lib/types';

export type { EmailTemplateId, TemplateVars };

export async function createTicketNotificationWithEmail(
  supabase: SupabaseClient<Database>,
  params: {
    p_recipient_id: string;
    p_ticket_id: string;
    p_type: string;
    templateId: EmailTemplateId;
    vars: TemplateVars;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { notificationTitle, notificationBody } = buildTemplate(params.templateId, params.vars);

  const { error } = await supabase.rpc('create_ticket_notification', {
    p_recipient_id: params.p_recipient_id,
    p_ticket_id: params.p_ticket_id,
    p_type: params.p_type,
    p_title: notificationTitle,
    p_body: notificationBody,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!isSmtpConfigured()) {
    return { ok: true };
  }

  const sr = createServiceRoleClient();
  const { data: profile } = await sr
    .from('profiles')
    .select('email, role')
    .eq('id', params.p_recipient_id)
    .maybeSingle();

  const to = profile?.email?.trim();
  if (!to) {
    return { ok: true };
  }

  const role = (profile?.role ?? 'employee') as UserRole;
  const portalUrl = buildNotificationEmailPortalUrl(params.p_ticket_id, role);
  const { text, html } = buildEmailBodies({
    notificationTitle,
    notificationBody,
    portalUrl,
  });

  try {
    await sendSmtpMail({
      to,
      subject: notificationTitle,
      text,
      html,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[ticket email]', msg);
    return { ok: false, error: msg };
  }

  return { ok: true };
}

/** Email only (e.g. duplicate in-app row already created by a DB trigger). */
export async function sendTicketNotificationEmail(params: {
  recipientUserId: string;
  ticketId: string;
  templateId: EmailTemplateId;
  vars: TemplateVars;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { ok: true };
  }

  const sr = createServiceRoleClient();
  const { data: profile } = await sr
    .from('profiles')
    .select('email, role')
    .eq('id', params.recipientUserId)
    .maybeSingle();

  const to = profile?.email?.trim();
  if (!to) {
    return { ok: true };
  }

  const { notificationTitle, notificationBody } = buildTemplate(params.templateId, params.vars);
  const role = (profile?.role ?? 'employee') as UserRole;
  const portalUrl = buildNotificationEmailPortalUrl(params.ticketId, role);
  const { text, html } = buildEmailBodies({
    notificationTitle,
    notificationBody,
    portalUrl,
  });

  try {
    await sendSmtpMail({
      to,
      subject: notificationTitle,
      text,
      html,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export { templateIdForClientStage };
