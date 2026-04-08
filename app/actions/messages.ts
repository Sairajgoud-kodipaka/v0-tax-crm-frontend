'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function sendTicketMessageAction(
  ticketId: string,
  body: string,
  options?: { isInternal?: boolean },
) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isInternal = Boolean(options?.isInternal);

  const { error } = await supabase.from('messages').insert({
    ticket_id: ticketId,
    sender_id: user.id,
    body: body.trim(),
    is_internal: isInternal,
  });

  if (error) throw new Error(error.message);

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

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}
