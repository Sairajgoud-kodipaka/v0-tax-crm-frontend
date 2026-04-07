import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSupabase } from '@/lib/data/tickets-queries';
import { STAGE_NAVIGATION } from '@/lib/constants';

type TicketLite = {
  id: string;
  stage: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  filing_type: string;
  assigned_employee_id: string | null;
};

type PaymentLite = {
  ticket_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

export default async function ReportsPage() {
  const supabase = await getServerSupabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const { data: ticketRows } = await supabase
    .from('tickets')
    .select('id, stage, due_date, created_at, updated_at, filing_type, assigned_employee_id');
  const { data: paymentRows } = await supabase
    .from('payments')
    .select('ticket_id, amount_cents, status, created_at');
  const { data: employeeRows } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'employee');

  const tickets = (ticketRows ?? []) as TicketLite[];
  const payments = (paymentRows ?? []) as PaymentLite[];
  const employees = employeeRows ?? [];

  const ytdRevenueCents = payments
    .filter((p) => p.status === 'succeeded' && new Date(p.created_at) >= yearStart)
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const completedTickets = tickets.filter((t) => t.stage === 'filing-completed' || t.stage === 'closed');
  const avgTurnaroundDays =
    completedTickets.length === 0
      ? 0
      : completedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const completed = new Date(t.updated_at).getTime();
          return sum + Math.max(0, completed - created) / (1000 * 60 * 60 * 24);
        }, 0) / completedTickets.length;

  const overdueCount = tickets.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < now && t.stage !== 'closed';
  }).length;

  const stageBreakdown = Object.fromEntries(STAGE_NAVIGATION.map((s) => [s.id, 0])) as Record<string, number>;
  for (const t of tickets) {
    stageBreakdown[t.stage] = (stageBreakdown[t.stage] ?? 0) + 1;
  }

  const performanceMonths = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return { key: monthKey(d), label: monthLabel(d), completed: 0, pending: 0, overdue: 0 };
  });
  const monthIndex = Object.fromEntries(performanceMonths.map((m, i) => [m.key, i]));
  for (const t of tickets) {
    const idx = monthIndex[monthKey(new Date(t.updated_at))];
    if (idx === undefined) continue;
    if (t.stage === 'filing-completed' || t.stage === 'closed') performanceMonths[idx].completed += 1;
    else performanceMonths[idx].pending += 1;
    if (t.due_date && new Date(t.due_date) < now && t.stage !== 'closed') performanceMonths[idx].overdue += 1;
  }

  const ticketMap = Object.fromEntries(tickets.map((t) => [t.id, t]));
  const serviceRevenue = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== 'succeeded') continue;
    const t = ticketMap[p.ticket_id];
    if (!t) continue;
    serviceRevenue.set(t.filing_type, (serviceRevenue.get(t.filing_type) ?? 0) + p.amount_cents);
  }
  const totalRevenue = [...serviceRevenue.values()].reduce((a, b) => a + b, 0);
  const revenueRows = [...serviceRevenue.entries()]
    .map(([service, cents]) => ({
      service,
      amount: cents / 100,
      percentage: totalRevenue > 0 ? Math.round((cents / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const employeeProductivity = employees
    .map((e) => {
      const mine = tickets.filter((t) => t.assigned_employee_id === e.id);
      return {
        id: e.id,
        name: e.full_name ?? e.email ?? 'Employee',
        completed: mine.filter((t) => t.stage === 'filing-completed' || t.stage === 'closed').length,
        pending: mine.filter((t) => t.stage !== 'filing-completed' && t.stage !== 'closed').length,
      };
    })
    .sort((a, b) => b.completed - a.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-muted-foreground">Live operational metrics from your Supabase data</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${(ytdRevenueCents / 100).toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground">Succeeded payments since Jan 1</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{avgTurnaroundDays.toFixed(1)} days</div>
            <p className="mt-1 text-xs text-muted-foreground">From ticket creation to completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{overdueCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Due date passed and not closed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stage Breakdown</CardTitle>
            <CardDescription>Current ticket volume by workflow stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STAGE_NAVIGATION.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                <span>{s.label}</span>
                <span className="font-semibold">{stageBreakdown[s.id] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend (6 months)</CardTitle>
            <CardDescription>Completed / pending / overdue counts by month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {performanceMonths.map((m) => (
              <div key={m.key} className="grid grid-cols-4 items-center gap-2 rounded border border-border p-2 text-sm">
                <span className="font-medium">{m.label}</span>
                <span className="text-emerald-600">Done: {m.completed}</span>
                <span className="text-blue-600">Pending: {m.pending}</span>
                <span className="text-amber-600">Overdue: {m.overdue}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Productivity</CardTitle>
          <CardDescription>Assigned workload and completed cases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {employeeProductivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees found.</p>
          ) : (
            employeeProductivity.map((row) => (
              <div key={row.id} className="grid grid-cols-3 items-center rounded border border-border p-2 text-sm">
                <span className="font-medium">{row.name}</span>
                <span>Completed: {row.completed}</span>
                <span>Pending: {row.pending}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service</CardTitle>
          <CardDescription>Distribution of succeeded payments by filing type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {revenueRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No succeeded payments available yet.</p>
          ) : (
            revenueRows.map((row) => (
              <div key={row.service} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.service}</span>
                  <span className="font-semibold">${row.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="report-revenue-bar-fill h-2 rounded bg-primary"
                    style={
                      {
                        '--bar-pct': String(row.percentage),
                      } as React.CSSProperties
                    }
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground">{row.percentage}% of total</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
