'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockTickets } from '@/lib/mock-data';
import { TICKET_STAGES, PRIORITIES } from '@/lib/constants';
import { TicketStage } from '@/lib/types';
import Link from 'next/link';

export default function EmployeeQueuesPage() {
  const stages: TicketStage[] = ['intake', 'document-collection', 'review', 'preparation', 'filing', 'amendment', 'follow-up', 'closed', 'on-hold'];
  const [selectedStage, setSelectedStage] = useState<TicketStage>('document-collection');

  // Filter tickets assigned to current employee
  const myAssignedTickets = mockTickets.filter(t => t.assignedToId === 'employee-1');
  const stageTickets = myAssignedTickets.filter(t => t.stage === selectedStage);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
        <p className="text-sm text-foreground">
          You have <strong>{myAssignedTickets.length}</strong> tickets assigned to you across all stages.
        </p>
      </div>

      {/* Stage Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {stages.map((stage) => {
          const stageTicketCount = myAssignedTickets.filter(t => t.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedStage === stage
                  ? `border-primary bg-primary/10`
                  : `border-border hover:border-primary/50`
              }`}
            >
              <p className="font-medium text-sm text-foreground">{TICKET_STAGES[stage].label}</p>
              <p className="text-lg font-bold text-primary">{stageTicketCount}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Details */}
      <Card>
        <CardHeader>
          <CardTitle>{TICKET_STAGES[selectedStage].label}</CardTitle>
          <CardDescription>{TICKET_STAGES[selectedStage].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {stageTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tickets in this stage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stageTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/employee/tickets/${ticket.id}`}
                  className="block p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground hover:text-primary">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{ticket.clientName}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{ticket.filingType}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${PRIORITIES[ticket.priority].color}`}>
                        {PRIORITIES[ticket.priority].label}
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
    </div>
  );
}
