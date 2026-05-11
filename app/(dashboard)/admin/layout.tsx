import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data/tickets-queries';
import { AdminDashboardShell } from '@/components/layouts/dashboard-role-shells';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  if (session.role !== 'admin') {
    if (session.role === 'employee') redirect('/employee');
    if (session.role === 'client') redirect('/client');
    redirect('/login');
  }

  return <AdminDashboardShell user={session}>{children}</AdminDashboardShell>;
}
