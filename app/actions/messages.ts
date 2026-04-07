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

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/client/cases/' + ticketId);
}
