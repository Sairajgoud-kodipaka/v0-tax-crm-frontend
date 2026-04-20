'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { logTicketActivityAction } from '@/app/actions/activity';

export async function saveTaxOrganizerAction(ticketId: string, answers: Record<string, unknown>) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role;

  const { data: ticket } = await supabase.from('tickets').select('client_id').eq('id', ticketId).single();
  if (!ticket) throw new Error('Not found');

  let clientIdForRow = ticket.client_id as string;

  if (role === 'client') {
    if (ticket.client_id !== user.id) throw new Error('Forbidden');
  } else if (role === 'admin' || role === 'employee') {
    clientIdForRow = ticket.client_id as string;
  } else {
    throw new Error('Forbidden');
  }

  const { error } = await supabase.from('tax_organizer_snapshots').upsert(
    {
      ticket_id: ticketId,
      client_id: clientIdForRow,
      answers: answers as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'ticket_id' },
  );

  if (error) throw new Error(error.message);

  // Log activity
  await logTicketActivityAction({
    ticketId,
    actionType: 'organizer_updated',
    details: { sections_updated: Object.keys(answers) },
    isVisibleToClient: false, // Internal update
    relatedEntityId: null,
    relatedEntityType: 'organizer',
  });

  revalidatePath('/client/cases/' + ticketId);
  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
}

export async function getTaxOrganizerAnswersAction(ticketId: string): Promise<Record<string, unknown>> {
  const supabase = createClient(await cookies());
  const { data } = await supabase.from('tax_organizer_snapshots').select('answers').eq('ticket_id', ticketId).maybeSingle();
  return (data?.answers as Record<string, unknown>) ?? {};
}
