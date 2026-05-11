import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { getServerSupabase } from '@/lib/data/tickets-queries';

type HistoryRow = {
  id: string;
  actor_id: string;
  ticket_id: string;
  from_stage: string | null;
  to_stage: string;
  note: string | null;
  created_at: string;
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const searchTerm = (sp.q ?? '').trim().toLowerCase();
  const filterType = sp.type ?? 'all';
  const supabase = await getServerSupabase();

  const { data: historyRows } = await supabase
    .from('ticket_history')
    .select('id, actor_id, ticket_id, from_stage, to_stage, note, created_at')
    .order('created_at', { ascending: false })
    .limit(300);

  const logs = (historyRows ?? []) as HistoryRow[];
  const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))];
  const ticketIds = [...new Set(logs.map((l) => l.ticket_id).filter(Boolean))];

  const [{ data: actorRows }, { data: ticketRows }] = await Promise.all([
    actorIds.length > 0
      ? supabase.from('profiles').select('id, full_name, email').in('id', actorIds)
      : Promise.resolve({ data: [] }),
    ticketIds.length > 0
      ? supabase.from('tickets').select('id, public_ref, subject').in('id', ticketIds)
      : Promise.resolve({ data: [] }),
  ]);

  const actorMap = Object.fromEntries((actorRows ?? []).map((p) => [p.id, p.full_name ?? p.email ?? 'Unknown user']));
  const ticketMap = Object.fromEntries((ticketRows ?? []).map((t) => [t.id, t]));

  const decoratedLogs = logs.map((log) => {
    const ticket = ticketMap[log.ticket_id] as { id: string; public_ref: number; subject: string } | undefined;
    return {
      id: log.id,
      userId: log.actor_id,
      userName: actorMap[log.actor_id] ?? 'Unknown user',
      action: log.from_stage ? 'Updated' : 'Created',
      resourceType: 'Ticket',
      resourceId: ticket?.public_ref ? String(ticket.public_ref) : log.ticket_id.slice(0, 8),
      timestamp: new Date(log.created_at),
      details: {
        ticketSubject: ticket?.subject ?? 'Ticket',
        fromStage: log.from_stage,
        toStage: log.to_stage,
        note: log.note,
      },
    };
  });

  const filteredLogs = decoratedLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm) ||
      log.action.toLowerCase().includes(searchTerm) ||
      log.resourceType.toLowerCase().includes(searchTerm) ||
      (log.details.ticketSubject as string).toLowerCase().includes(searchTerm);
    const matchesType = filterType === 'all' || log.resourceType.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created':
        return 'text-green-600 bg-green-50';
      case 'Updated':
        return 'text-blue-600 bg-blue-50';
      case 'Deleted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Track all system changes and user activities</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action="/admin/audit-logs" className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  name="q"
                  type="text"
                  placeholder="Search by user, action, or resource..."
                  defaultValue={sp.q ?? ''}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
                />
              </div>
            </div>
            <select
              name="type"
              defaultValue={filterType}
              className="px-4 py-2 border border-border rounded-lg bg-background"
            >
              <option value="all">All Resources</option>
              <option value="Ticket">Tickets</option>
            </select>
            <button type="submit" className="px-4 py-2 border border-border rounded-lg bg-background text-sm">
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit logs found</p>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-medium text-foreground">{log.resourceType}</span>
                      <span className="text-sm text-muted-foreground">#{log.resourceId}</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>By: {log.userName}</span>
                      <span>•</span>
                      <span>{log.timestamp.toLocaleString()}</span>
                    </div>
                    {log.details && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                        <p className="font-mono">{JSON.stringify(log.details).slice(0, 180)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{decoratedLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {decoratedLogs.filter((log) => {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return log.timestamp > oneWeekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {new Set(decoratedLogs.map((log) => log.userId)).size}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
