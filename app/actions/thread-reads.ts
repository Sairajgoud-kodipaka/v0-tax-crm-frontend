'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/** Updates read cursor to the latest message visible to this user (non-internal only for clients). */
export async function markTicketThreadReadAction(ticketId: string): Promise<void> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role as string | undefined;
  const isStaff = role === 'admin' || role === 'employee';

  const { data: rows, error: qErr } = await supabase
    .from('messages')
    .select('id, created_at, is_internal')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (qErr || !rows?.length) return;

  const visible = isStaff ? rows : rows.filter((m) => !m.is_internal);
  const last = visible[visible.length - 1];
  if (!last?.id) return;

  await supabase.from('ticket_thread_reads').upsert(
    {
      ticket_id: ticketId,
      user_id: user.id,
      last_read_message_id: last.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'ticket_id,user_id' },
  );
}
