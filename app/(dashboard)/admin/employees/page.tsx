import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { getTicketAssignmentCountsByEmployee } from '@/lib/data/clients-queries';
import { getServerSupabase, getSessionUser } from '@/lib/data/tickets-queries';
import { AddEmployeeForm } from './add-employee-form';
import { EmployeeList } from './employee-list';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'employee' | 'client';
  created_at: string;
};

export default async function EmployeesPage() {
  const [supabase, session, ticketCounts] = await Promise.all([
    getServerSupabase(),
    getSessionUser(),
    getTicketAssignmentCountsByEmployee(),
  ]);

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .in('role', ['admin', 'employee'])
    .order('created_at', { ascending: true });

  const employees = ((data ?? []) as ProfileRow[]).map((p) => ({
    id: p.id,
    name: p.full_name ?? 'Unknown user',
    email: p.email ?? '',
    role: p.role,
    department: 'Tax Operations',
    status: 'active' as const,
    assignedTicketCount: ticketCounts[p.id]?.total ?? 0,
    activeTicketCount: ticketCounts[p.id]?.active ?? 0,
  }));
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const roster = session ? activeEmployees.filter((e) => e.id !== session.id) : activeEmployees;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their assignments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Employee
          </CardTitle>
          <CardDescription>Create a new employee login or promote an existing user by email.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddEmployeeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team roster ({roster.length})</CardTitle>
          <CardDescription>
            Active staff other than you, with how many tickets they handle as primary preparer. Click a row to review those
            tickets and stages on Clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeList employees={roster} />
        </CardContent>
      </Card>
    </div>
  );
}
