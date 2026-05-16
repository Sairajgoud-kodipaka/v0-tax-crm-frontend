import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TICKET_STAGES, STAGE_NAVIGATION } from '@/lib/constants';
import { getAdminDashboardData } from '@/lib/data/admin-stats';
import { AdminDashboardCharts } from '@/app/(dashboard)/admin/admin-dashboard-charts';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';
import { AdminDeleteTicketButton } from '@/app/(dashboard)/admin/admin-delete-ticket-button';

export default async function AdminDashboard() {
  const stats = await getAdminDashboardData();

  const stageData = STAGE_NAVIGATION.map((s) => ({
    name: s.label,
    value: stats.stageBreakdown[s.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <QueueRealtimeRefresh />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Cases in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Not closed / completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Filing completed or closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue (due date)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Past due and not closed</p>
          </CardContent>
        </Card>
      </div>

      <AdminDashboardCharts stageData={stageData} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Latest updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTickets.map((ticket) => {
              const stageInfo = TICKET_STAGES[ticket.stage];
              return (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={`/admin/tickets/${ticket.id}`}
                    className="flex-1 rounded-md transition-colors hover:bg-muted/30"
                  >
                    <h3 className="font-medium text-foreground">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {ticket.clientName} • {ticket.filingType}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-sm text-xs font-medium ${stageInfo?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {stageInfo?.label || ticket.stage}
                      </span>
                      <span className="text-sm text-muted-foreground">{ticket.assignedToName || 'Unassigned'}</span>
                    </div>
                  </Link>
                  <div className="shrink-0">
                    <AdminDeleteTicketButton ticketId={ticket.id} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Employees (from profiles)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.employees.map((employee) => (
              <div key={employee.id} className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.department}</p>
                <p className="text-xs text-muted-foreground mt-2">{employee.email}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
