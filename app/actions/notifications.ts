'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function markNotificationReadAction(notificationId: string) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('recipient_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/notifications');
  revalidatePath('/employee/notifications');
  revalidatePath('/client/notifications');
}

export async function markAllNotificationsReadAction() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/notifications');
  revalidatePath('/employee/notifications');
  revalidatePath('/client/notifications');
}
