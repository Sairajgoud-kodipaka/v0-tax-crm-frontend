'use client';

import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { mockTickets } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TicketStage } from '@/lib/types';

export default function EmployeeQueuesPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const selectedStage = (searchParams.get('stage') as TicketStage) || 'pending-info';

  // Filter tickets by selected stage AND assigned to current employee
  const filteredTickets = mockTickets.filter(
    ticket => ticket.stage === selectedStage && ticket.assignedToId === user?.id
  );

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
      {/* Stage Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{stageInfo.label}</h1>
        <p className="text-muted-foreground">{stageInfo.description}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} assigned to you in this stage
        </p>
      </div>

      {/* Tickets List */}
      {filteredTickets.length > 0 ? (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Link key={ticket.id} href={`/employee/tickets/${ticket.id}`}>
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
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{ticket.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Client Email</p>
                      <p className="font-medium text-sm">{ticket.clientEmail}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No tickets assigned to you in this stage yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
