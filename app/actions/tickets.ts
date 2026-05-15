'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { sendTicketMessageAction } from '@/app/actions/messages';
import { logTicketActivityAction } from '@/app/actions/activity';
import type { TicketStage } from '@/lib/types';

export async function updateTicketStageAction(ticketId: string, toStage: TicketStage, note?: string) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.rpc('update_ticket_stage', {
    p_ticket_id: ticketId,
    p_to_stage: toStage,
    p_note: note ?? null,
  });

  if (error) throw new Error(error.message);

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'stage_changed',
    details: { 
      to_stage: toStage, 
      note: note ?? null,
      display_text: `Stage changed to ${toStage}${note ? ` - ${note}` : ''}`
    },
    isVisibleToClient: true,
    relatedEntityId: null,
    relatedEntityType: null,
  });

  const { data: ticket } = await supabase
    .from('tickets')
    .select('assigned_employee_id, public_ref')
    .eq('id', ticketId)
    .maybeSingle();
  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const actorName = me?.full_name?.trim() || 'Staff';
  const stageTitle = `Stage move needed`;
  const stageBody = `Case #${ticket?.public_ref ?? ticketId} moved to ${toStage} by ${actorName}.`;

  if (ticket?.assigned_employee_id && ticket.assigned_employee_id !== user.id) {
    const { error: assignedErr } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: ticket.assigned_employee_id,
      p_ticket_id: ticketId,
      p_type: 'stage_move_needed',
      p_title: stageTitle,
      p_body: stageBody,
    });
    if (assignedErr) console.error('create_ticket_notification:', assignedErr.message);
  }

  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  for (const admin of admins ?? []) {
    if (admin.id === user.id) continue;
    const { error: adminErr } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: admin.id,
      p_ticket_id: ticketId,
      p_type: 'stage_move_needed',
      p_title: stageTitle,
      p_body: stageBody,
    });
    if (adminErr) console.error('create_ticket_notification:', adminErr.message);
  }

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/queues');
  revalidatePath('/employee/queues');
}

/** From Draft Sent: client approves (→ awaiting-approval) or requests changes (→ under-prep). Optional message on the ticket thread. */
export async function clientDraftResponseAction(
  ticketId: string,
  action: 'approve' | 'request_changes',
  options?: { threadMessage?: string },
) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const trimmed = options?.threadMessage?.trim();
  if (action === 'request_changes' && !trimmed) {
    throw new Error('Please describe the changes you need');
  }

  const { error } = await supabase.rpc('client_draft_response', {
    p_ticket_id: ticketId,
    p_action: action,
  });
  if (error) throw new Error(error.message);

  if (trimmed) {
    await sendTicketMessageAction(ticketId, trimmed, { isInternal: false });
  }

  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/admin/queues');
  revalidatePath('/employee/queues');
}

export async function deleteTicketByAdminAction(ticketId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile, error: roleError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (roleError || profile?.role !== 'admin') {
    throw new Error('Only admins can delete tickets');
  }

  const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/admin/queues');
}

export async function staffReviewDraftAction(args: {
  ticketId: string;
  draftId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'employee')) {
    throw new Error('Only staff can review drafts');
  }

  if (args.decision === 'rejected') {
    const trimmed = args.reason?.trim() ?? '';
    if (trimmed.length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }
  }

  const actorName = me.full_name?.trim() || 'Staff';
  const actionType = args.decision === 'approved' ? 'draft_approved' : 'draft_rejected';
  const displayText =
    args.decision === 'approved'
      ? `${actorName} approved the tax draft`
      : `${actorName} rejected the tax draft`;

  await logTicketActivityAction({
    ticketId: args.ticketId,
    actionType,
    details: {
      draft_id: args.draftId,
      draft_status: args.decision,
      reason: args.reason?.trim() || null,
      actor_name: actorName,
      display_text: displayText,
    },
    isVisibleToClient: false,
    relatedEntityId: args.draftId,
    relatedEntityType: 'document',
  });

  const { data: ticket } = await supabase
    .from('tickets')
    .select('assigned_employee_id, public_ref')
    .eq('id', args.ticketId)
    .maybeSingle();

  if (ticket?.assigned_employee_id && ticket.assigned_employee_id !== user.id) {
    const title = args.decision === 'approved' ? 'Draft Approved' : 'Draft Rejected';
    const body =
      args.decision === 'approved'
        ? `Draft for #${ticket.public_ref ?? args.ticketId} was approved by ${actorName}.`
        : `Draft for #${ticket.public_ref ?? args.ticketId} was rejected by ${actorName}.`;
    const { error: notifyErr } = await supabase.rpc('create_ticket_notification', {
      p_recipient_id: ticket.assigned_employee_id,
      p_ticket_id: args.ticketId,
      p_type: args.decision === 'approved' ? 'draft_approved' : 'draft_rejected',
      p_title: title,
      p_body: body,
    });
    if (notifyErr) {
      console.error('create_ticket_notification:', notifyErr.message);
    }
  }

  revalidatePath('/admin/tickets/' + args.ticketId);
  revalidatePath('/employee/tickets/' + args.ticketId);
  revalidatePath('/admin/queues');
  revalidatePath('/employee/queues');
}

/** Client: mark organizer + documents submitted (pending-info only); posts a message for staff. */
export async function submitClientInformationAction(ticketId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.rpc('submit_client_information', {
    p_ticket_id: ticketId,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}
