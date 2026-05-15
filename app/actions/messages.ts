'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { logTicketActivityAction } from '@/app/actions/activity';

function extractMentions(text: string): string[] {
  const names: string[] = [];
  const rx = /@([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/g;
  let match: RegExpExecArray | null = null;
  while ((match = rx.exec(text)) !== null) {
    const normalized = match[1].trim().toLowerCase();
    if (!normalized || names.includes(normalized)) continue;
    names.push(normalized);
  }
  return names;
}

export async function sendTicketMessageAction(
  ticketId: string,
  body: string,
  options?: { isInternal?: boolean },
) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isInternal = Boolean(options?.isInternal);

  const trimmedBody = body.trim();
  const { data: insertedMessage, error } = await supabase
    .from('messages')
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      body: trimmedBody,
      is_internal: isInternal,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'message_sent',
    details: { message_preview: trimmedBody.substring(0, 100) },
    isVisibleToClient: !isInternal,
    relatedEntityId: insertedMessage?.id ?? null,
    relatedEntityType: 'message',
  });

  const { data: ticket } = await supabase
    .from('tickets')
    .select('client_id, assigned_employee_id, public_ref')
    .eq('id', ticketId)
    .maybeSingle();

  const { data: me } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const caseLabel = ticket ? `Case #${ticket.public_ref}` : '';

  const notify = async (args: {
    p_recipient_id: string;
    p_ticket_id: string;
    p_type: string;
    p_title: string;
    p_body: string;
  }) => {
    const { error: nErr } = await supabase.rpc('create_ticket_notification', args);
    if (nErr) console.error('create_ticket_notification:', nErr.message);
  };

  if (ticket && me?.role === 'client' && !isInternal && ticket.assigned_employee_id) {
    const clientName = me.full_name?.trim() || 'Client';
    await notify({
      p_recipient_id: ticket.assigned_employee_id,
      p_ticket_id: ticketId,
      p_type: 'message',
      p_title: `${clientName} sent you a message`,
      p_body: `${caseLabel}`,
    });
  } else if (ticket && (me?.role === 'admin' || me?.role === 'employee') && !isInternal) {
    const title =
      me.role === 'employee'
        ? 'Your preparer sent you a message'
        : 'Staff sent you a message';
    await notify({
      p_recipient_id: ticket.client_id,
      p_ticket_id: ticketId,
      p_type: 'message',
      p_title: title,
      p_body: `${caseLabel}`,
    });
  } else if (ticket && me?.role === 'admin' && isInternal && ticket.assigned_employee_id) {
    await notify({
      p_recipient_id: ticket.assigned_employee_id,
      p_ticket_id: ticketId,
      p_type: 'message',
      p_title: 'Admin left a note',
      p_body: `Admin left a note on ${caseLabel}.`,
    });
  }

  if (ticket && isInternal && (me?.role === 'admin' || me?.role === 'employee')) {
    const mentions = extractMentions(trimmedBody);
    if (mentions.length > 0) {
      const { data: mentionCandidates } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .or(`id.eq.${ticket.assigned_employee_id ?? ''},role.eq.admin`);
      const mentionTargets = (mentionCandidates ?? []).filter((candidate) => {
        const full = `${candidate.full_name ?? ''}`.trim().toLowerCase();
        return mentions.includes(full) || mentions.some((m) => full.startsWith(m));
      });
      for (const target of mentionTargets) {
        if (target.id === user.id) continue;
        await notify({
          p_recipient_id: target.id,
          p_ticket_id: ticketId,
          p_type: 'mention',
          p_title: '@Mention in Preparer Notes',
          p_body: `${me?.full_name?.trim() || 'Staff'} mentioned you in ${caseLabel}.`,
        });
      }
    }
  }

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}

export async function escalateInternalThreadAction(ticketId: string, messageId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: me } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'employee')) throw new Error('Forbidden');

  const { data: ticket } = await supabase
    .from('tickets')
    .select('public_ref')
    .eq('id', ticketId)
    .maybeSingle();

  await logTicketActivityAction({
    ticketId,
    actionType: 'message_sent',
    details: {
      display_text: `${me.full_name?.trim() || 'Staff'} escalated an internal issue.`,
      escalated_message_id: messageId,
      escalated: true,
    },
    isVisibleToClient: false,
    relatedEntityId: messageId,
    relatedEntityType: 'message',
  });

  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  for (const admin of admins ?? []) {
    if (admin.id === user.id) continue;
    const { error: nErr } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: admin.id,
      p_ticket_id: ticketId,
      p_type: 'escalation',
      p_title: 'Escalation',
      p_body: `${me.full_name?.trim() || 'Staff'} escalated an issue in Case #${ticket?.public_ref ?? ticketId}.`,
    });
    if (nErr) console.error('create_ticket_notification:', nErr.message);
  }

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}

export async function markInternalThreadResolvedAction(ticketId: string, messageId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: me } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'employee')) throw new Error('Forbidden');

  await logTicketActivityAction({
    ticketId,
    actionType: 'message_sent',
    details: {
      display_text: `${me.full_name?.trim() || 'Staff'} marked an internal note as resolved.`,
      resolved_message_id: messageId,
      resolved: true,
    },
    isVisibleToClient: false,
    relatedEntityId: messageId,
    relatedEntityType: 'message',
  });

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}
