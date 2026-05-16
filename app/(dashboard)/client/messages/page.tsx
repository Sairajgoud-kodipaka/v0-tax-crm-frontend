import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientTicketThread } from '@/components/messages/client-ticket-thread';
import { Search } from 'lucide-react';
import { getSessionUser, getServerSupabase } from '@/lib/data/tickets-queries';
import type { UserRole } from '@/lib/types';

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type TicketRow = {
  id: string;
  subject: string;
  assigned_employee_id: string | null;
};
type EmployeeRow = {
  id: string;
  full_name: string | null;
};

export default async function ClientMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string; q?: string }>;
}) {
  const session = await getSessionUser();
  if (!session || session.role !== 'client') return null;

  const sp = await searchParams;
  const q = (sp.q ?? '').trim().toLowerCase();
  const supabase = await getServerSupabase();

  const { data: ticketRows } = await supabase
    .from('tickets')
    .select('id, subject, assigned_employee_id')
    .eq('client_id', session.id)
    .order('updated_at', { ascending: false });

  const clientTickets = (ticketRows ?? []) as TicketRow[];
  const filteredTickets = q
    ? clientTickets.filter((t) => t.subject.toLowerCase().includes(q))
    : clientTickets;

  const selectedTicketId =
    filteredTickets.find((t) => t.id === sp.ticket)?.id ?? filteredTickets[0]?.id ?? null;

  const employeeIds = [...new Set(clientTickets.map((t) => t.assigned_employee_id).filter(Boolean) as string[])];
  const ticketIds = filteredTickets.map((t) => t.id);

  const [{ data: employeeRows }, { data: msgRows }] = await Promise.all([
    employeeIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', employeeIds)
      : Promise.resolve({ data: [] }),
    ticketIds.length > 0
      ? supabase
          .from('messages')
          .select('id, ticket_id, sender_id, body, created_at')
          .in('ticket_id', ticketIds)
          .eq('is_internal', false)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);
  const employeeNames = Object.fromEntries(
    ((employeeRows ?? []) as EmployeeRow[]).map((e) => [e.id, e.full_name ?? 'Tax preparer']),
  );

  const messagesByTicket = (msgRows ?? []).reduce<Record<string, MessageRow[]>>((acc, row) => {
    const msg = row as MessageRow;
    acc[msg.ticket_id] = [...(acc[msg.ticket_id] ?? []), msg];
    return acc;
  }, {});
  const selectedTicketMessages = selectedTicketId ? messagesByTicket[selectedTicketId] ?? [] : [];
  const selectedTicket = selectedTicketId ? filteredTickets.find((t) => t.id === selectedTicketId) : null;
  const preparerName =
    employeeNames[selectedTicket?.assigned_employee_id ?? ''] ?? 'your tax preparer';

  const threadMessages = selectedTicketMessages.map((msg) => ({
    id: msg.id,
    senderId: msg.sender_id,
    senderName: msg.sender_id === session.id ? 'You' : preparerName,
    senderRole: (msg.sender_id === session.id ? 'client' : 'employee') as UserRole,
    body: msg.body,
    createdAt: msg.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">Communicate with our team about your cases</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Your Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <form action="/client/messages" className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={sp.q ?? ''}
                type="text"
                placeholder="Search cases..."
                className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm"
              />
            </form>

            <div className="max-h-96 space-y-1 overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No cases found</p>
              ) : (
                filteredTickets.map((ticket) => {
                  const caseMessages = messagesByTicket[ticket.id] ?? [];
                  const isSelected = selectedTicketId === ticket.id;
                  return (
                    <Link
                      key={ticket.id}
                      href={`/client/messages?ticket=${ticket.id}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`}
                      className={`block rounded-lg border p-3 text-left transition-all ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {caseMessages.length} message{caseMessages.length !== 1 ? 's' : ''}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden lg:col-span-2">
          <CardHeader className="border-b border-border/80 pb-3">
            <CardTitle className="text-base">{selectedTicket?.subject ?? 'Select a case'}</CardTitle>
            <CardDescription>
              {selectedTicketId ? `Conversation with ${preparerName}` : 'Select a case to view messages'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {selectedTicketId ? (
              <ClientTicketThread
                ticketId={selectedTicketId}
                viewerUserId={session.id}
                messages={threadMessages}
              />
            ) : (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                Select a case from the list to view or send messages
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
