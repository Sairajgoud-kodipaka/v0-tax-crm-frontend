import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessionUser, listAllTicketsForStaff } from '@/lib/data/tickets-queries';
import { displayTicketRef } from '@/lib/client-ui';

export default async function EmployeeMessagesPage() {
  const [session, myTickets] = await Promise.all([getSessionUser(), listAllTicketsForStaff()]);
  if (!session || session.role !== 'employee') return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Open a ticket to view the full message thread and reply. All team cases are listed here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team cases</CardTitle>
          <CardDescription>Select a ticket to work messages in context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {myTickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {myTickets.map((ticket) => (
                <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium text-foreground">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.clientName} · #{displayTicketRef(ticket)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employee/tickets/${ticket.id}`}>Open ticket</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
