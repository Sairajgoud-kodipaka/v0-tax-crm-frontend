'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
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

  revalidatePath('/admin/tickets/' + ticketId);
  revalidatePath('/employee/tickets/' + ticketId);
  revalidatePath('/admin/queues');
  revalidatePath('/employee/queues');
}
