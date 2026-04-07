import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TICKET_STAGES } from '@/lib/constants';
import { getSessionUser } from '@/lib/data/tickets-queries';
import { getEmployeeDashboardData } from '@/lib/data/employee-stats';
import { EmployeeBarChart } from '@/app/(dashboard)/employee/employee-bar-chart';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';

export default async function EmployeeDashboard() {
  const session = await getSessionUser();
  if (!session || session.role !== 'employee') return null;

  const d = await getEmployeeDashboardData(session.id);

  return (
    <div className="space-y-6">
      <QueueRealtimeRefresh />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{d.myTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{d.inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{d.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Your cases closed</p>
          </CardContent>
        </Card>
      </div>

      <EmployeeBarChart data={d.stageData} />

      <Card>
        <CardHeader>
          <CardTitle>My Assigned Tickets</CardTitle>
          <CardDescription>Cases assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          {d.myTickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tickets assigned to you</p>
          ) : (
            <div className="space-y-3">
              {d.myTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/employee/tickets/${ticket.id}`}
                  className="block p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground hover:text-primary">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{ticket.clientName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${TICKET_STAGES[ticket.stage].color}`}
                      >
                        {TICKET_STAGES[ticket.stage].label}
                      </span>
                      <p className="text-xs text-muted-foreground capitalize">{ticket.status}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>Use the sidebar stages to filter your queue</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open <Link href="/employee/queues?stage=pending-info">
              queues
            </Link>{' '}
            or an individual ticket to send messages and update stages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
