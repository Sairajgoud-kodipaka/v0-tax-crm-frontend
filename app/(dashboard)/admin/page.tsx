'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDashboardStats, mockTickets, mockEmployees } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const chartColors = ['#1e3a8a', '#047857', '#7c3aed', '#db2777', '#ea580c'];

export default function AdminDashboard() {
  const stats = mockDashboardStats;
  const stageData = Object.entries(stats.stageBreakdown).map(([stage, count]) => ({
    name: TICKET_STAGES[stage as keyof typeof TICKET_STAGES].label,
    value: count,
  }));

  const recentTickets = mockTickets.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Active cases in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Cases filed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Stage</CardTitle>
            <CardDescription>Current distribution across workflow stages</CardDescription>
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

        {/* Stage Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <CardDescription>Percentage of cases in each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="var(--primary)"
                  dataKey="value"
                >
                  {stageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Latest cases submitted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground">{ticket.clientName} • {ticket.filingType}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${TICKET_STAGES[ticket.stage].color}`}>
                    {TICKET_STAGES[ticket.stage].label}
                  </span>
                  <span className="text-sm text-muted-foreground">{ticket.assignedToName || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Active employees on staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockEmployees.map((employee) => (
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
