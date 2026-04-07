'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function createInvitationLinkAction(): Promise<{ url: string; token: string }> {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'employee') {
    throw new Error('Only employees can create invitations');
  }

  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('invitation_links').insert({
    token,
    employee_id: user.id,
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof process.env.VERCEL_URL === 'string' ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  revalidatePath('/employee');
  return { token, url: `${base.replace(/\/$/, '')}/signup?token=${encodeURIComponent(token)}` };
}
