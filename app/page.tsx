import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Home() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/login');

  switch (profile.role) {
    case 'admin':
      redirect('/admin');
    case 'employee':
      redirect('/employee');
    case 'client':
      redirect('/client');
    default:
      redirect('/login');
  }
}
