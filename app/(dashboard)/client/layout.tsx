import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data/tickets-queries';
import { ClientDashboardShell } from '@/components/layouts/dashboard-role-shells';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  if (session.role !== 'client') {
    if (session.role === 'admin') redirect('/admin');
    if (session.role === 'employee') redirect('/employee');
    redirect('/login');
  }

  return <ClientDashboardShell user={session}>{children}</ClientDashboardShell>;
}
