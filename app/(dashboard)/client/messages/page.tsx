import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Send } from 'lucide-react';
import { getSessionUser, getServerSupabase } from '@/lib/data/tickets-queries';
import { sendClientMessageFormAction } from '@/app/actions/forms';

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
  const { data: employeeRows } =
    employeeIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', employeeIds)
      : { data: [] };
  const employeeNames = Object.fromEntries(
    ((employeeRows ?? []) as EmployeeRow[]).map((e) => [e.id, e.full_name ?? 'Tax preparer']),
  );

  const ticketIds = filteredTickets.map((t) => t.id);
  const { data: msgRows } =
    ticketIds.length > 0
      ? await supabase
          .from('messages')
          .select('id, ticket_id, sender_id, body, created_at')
          .in('ticket_id', ticketIds)
          .eq('is_internal', false)
          .order('created_at', { ascending: true })
      : { data: [] };

  const messagesByTicket = (msgRows ?? []).reduce<Record<string, MessageRow[]>>((acc, row) => {
    const msg = row as MessageRow;
    acc[msg.ticket_id] = [...(acc[msg.ticket_id] ?? []), msg];
    return acc;
  }, {});
  const selectedTicketMessages = selectedTicketId ? messagesByTicket[selectedTicketId] ?? [] : [];

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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selectedTicketId ? filteredTickets.find((t) => t.id === selectedTicketId)?.subject : 'Select a case'}</CardTitle>
            <CardDescription>
              {selectedTicketId
                ? `Conversation with ${
                    employeeNames[
                      filteredTickets.find((t) => t.id === selectedTicketId)?.assigned_employee_id ?? ''
                    ] ?? 'your tax preparer'
                  }`
                : 'Select a case to view messages'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTicketId ? (
              <>
                <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-4">
                  {selectedTicketMessages.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    selectedTicketMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === session.id ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs rounded-lg px-4 py-2 ${
                            msg.sender_id === session.id
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card text-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.body}</p>
                          <p className={`mt-1 text-xs ${msg.sender_id === session.id ? 'opacity-80' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form action={sendClientMessageFormAction} className="space-y-2 border-t border-border pt-4">
                  <input type="hidden" name="ticketId" value={selectedTicketId} />
                  <Textarea name="body" placeholder="Type your message..." className="min-h-20 resize-none" required />
                  <Button type="submit" className="w-full gap-2 bg-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Select a case from the list to view or send messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
