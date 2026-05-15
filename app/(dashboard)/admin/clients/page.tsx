import { redirect } from 'next/navigation';
import { ClientsDirectory } from '@/components/clients/clients-directory';
import { EmployeeClientsView } from '@/components/clients/employee-clients-view';
import {
  listClientDirectory,
  listEmployeeClientTickets,
  listEmployeesForClientFilter,
  listStaffProfilesForAdminSwitcher,
} from '@/lib/data/clients-queries';
import { getSessionUser } from '@/lib/data/tickets-queries';

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; assigned?: string; employeeView?: string; stageFilter?: string }>;
}) {
  const [session, sp] = await Promise.all([getSessionUser(), searchParams]);
  if (!session || session.role !== 'admin') redirect('/admin');

  const q = sp.q ?? '';
  const assigned = sp.assigned ?? 'all';
  const employeeView = sp.employeeView ?? '';
  const stageFilter = sp.stageFilter ?? 'all';

  const [rows, employees] = await Promise.all([
    listClientDirectory({ q, assignedFilter: assigned }),
    listEmployeesForClientFilter(),
  ]);

  if (employeeView) {
    const [employeeRows, staffForSwitcher] = await Promise.all([
      listEmployeeClientTickets(employeeView),
      listStaffProfilesForAdminSwitcher(),
    ]);
    const backHref = `/admin/clients?q=${encodeURIComponent(q)}&assigned=${encodeURIComponent(assigned)}`;
    return (
      <EmployeeClientsView
        employeeId={employeeView}
        employees={staffForSwitcher}
        rows={employeeRows}
        stageFilter={stageFilter}
        backHref={backHref}
      />
    );
  }

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
