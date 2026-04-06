'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTickets, mockDashboardStats } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

export default function EmployeeDashboard() {
  // Get tickets assigned to current employee (using employee-1 as example)
  const myTickets = mockTickets.filter(t => t.assignedToId === 'employee-1');
  const inProgressCount = myTickets.filter(t => t.status === 'in-progress').length;
  const completedCount = mockTickets.filter(t => t.assignedToId === 'employee-1' && t.stage === 'closed').length;

  const stageData = Object.entries(mockDashboardStats.stageBreakdown).map(([stage, count]) => ({
    name: TICKET_STAGES[stage as keyof typeof TICKET_STAGES].label,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{myTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Cases filed</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Queue Distribution</CardTitle>
          <CardDescription>Current distribution across all workflow stages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar dataKey="value" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* My Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Tickets</CardTitle>
          <CardDescription>Cases assigned to you for completion</CardDescription>
        </CardHeader>
        <CardContent>
          {myTickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tickets assigned to you</p>
          ) : (
            <div className="space-y-3">
              {myTickets.map((ticket) => (
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${TICKET_STAGES[ticket.stage].color}`}>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'Updated case', ticket: 'ticket-001', time: '2 hours ago' },
              { action: 'Sent message to', ticket: 'ticket-002', time: '4 hours ago' },
              { action: 'Completed stage', ticket: 'ticket-003', time: '1 day ago' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.ticket}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
