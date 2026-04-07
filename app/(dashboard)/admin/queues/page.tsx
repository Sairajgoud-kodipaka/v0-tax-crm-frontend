import Link from 'next/link';
import { TICKET_STAGES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { TicketStage } from '@/lib/types';
import { listTicketsForStage } from '@/lib/data/tickets-queries';

export default async function AdminQueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const selectedStage = (sp.stage as TicketStage) || 'pending-info';

  const filteredTickets = await listTicketsForStage(selectedStage, 'admin', '');
  const stageInfo = TICKET_STAGES[selectedStage];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{stageInfo.label}</h1>
        <p className="text-muted-foreground">{stageInfo.description}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} in this stage (all
          employees)
        </p>
      </div>

      {filteredTickets.length > 0 ? (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.clientName}</p>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Filing Type</p>
                      <p className="font-medium">{ticket.filingType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax Year</p>
                      <p className="font-medium">{ticket.taxYear}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{ticket.assignedToName || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{ticket.status}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Updated: {ticket.updatedAt.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">No tickets in this stage yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
