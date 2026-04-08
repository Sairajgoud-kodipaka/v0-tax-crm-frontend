import { redirect } from 'next/navigation';
import { ClientsDirectory } from '@/components/clients/clients-directory';
import { listClientDirectory, listEmployeesForClientFilter } from '@/lib/data/clients-queries';
import { getSessionUser } from '@/lib/data/tickets-queries';

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; assigned?: string }>;
}) {
  const session = await getSessionUser();
  if (!session || session.role !== 'admin') redirect('/admin');

  const sp = await searchParams;
  const q = sp.q ?? '';
  const assigned = sp.assigned ?? 'all';

  const [rows, employees] = await Promise.all([
    listClientDirectory({ q, assignedFilter: assigned }),
    listEmployeesForClientFilter(),
  ]);

  return (
    <ClientsDirectory
      rows={rows}
      employees={employees}
      basePath="/admin"
      initialQ={q}
      initialAssigned={assigned}
    />
  );
}
