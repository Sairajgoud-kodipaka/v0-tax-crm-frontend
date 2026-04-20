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
