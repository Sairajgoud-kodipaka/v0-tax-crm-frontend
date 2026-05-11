import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data/tickets-queries';
import { EmployeeDashboardShell } from '@/components/layouts/dashboard-role-shells';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  if (session.role !== 'employee') {
    if (session.role === 'admin') redirect('/admin');
    if (session.role === 'client') redirect('/client');
    redirect('/login');
  }

  return <EmployeeDashboardShell user={session}>{children}</EmployeeDashboardShell>;
}
