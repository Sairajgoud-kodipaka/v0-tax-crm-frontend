import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { EmployeeDashboardShell } from '@/components/layouts/dashboard-role-shells';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/login');

  if (profile.role !== 'employee') {
    if (profile.role === 'admin') redirect('/admin');
    if (profile.role === 'client') redirect('/client');
    redirect('/login');
  }

  const sessionUser = {
    id: user.id,
    email: user.email ?? profile.email ?? '',
    name: profile.full_name ?? user.email?.split('@')[0] ?? 'Employee',
    role: 'employee' as const,
  };

  return <EmployeeDashboardShell user={sessionUser}>{children}</EmployeeDashboardShell>;
}
