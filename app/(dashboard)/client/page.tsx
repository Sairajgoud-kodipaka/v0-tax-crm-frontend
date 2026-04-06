'use client';

import { useState } from 'react';
import { mockTickets, mockMessages } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Upload } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboard() {
  const clientTickets = mockTickets.filter(t => t.clientName === 'John Doe');
  const [selectedTicket, setSelectedTicket] = useState(clientTickets[0]);
  const ticketMessages = mockMessages.filter(m => m.ticketId === selectedTicket?.id);

  const getStageNumber = (stage: string): number => {
    const stageKeys = Object.keys(TICKET_STAGES);
    return stageKeys.indexOf(stage) + 1;
  };

  const getTotalStages = (): number => {
    return Object.keys(TICKET_STAGES).length;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tax Filing Status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tax Filing Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTicket ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">CURRENT STAGE</p>
                <p className="text-2xl font-bold capitalize">{TICKET_STAGES[selectedTicket.stage]?.label}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">Step {getStageNumber(selectedTicket.stage)} of {getTotalStages()}</p>
              </div>
              <p className="text-muted-foreground">
                {selectedTicket.stage === 'pending-info' && "We're collecting your tax information."}
                {selectedTicket.stage === 'under-prep' && "We're preparing your tax documents."}
                {selectedTicket.stage === 'draft-sent' && "Please review the draft documents we've prepared."}
                {selectedTicket.stage === 'awaiting-approval' && "Awaiting your approval on the documents."}
                {selectedTicket.stage === 'payment-received' && "Payment received. Preparing final documents."}
                {selectedTicket.stage === '8879-sent' && "Please sign and return the authorization form."}
                {selectedTicket.stage === '8879-received' && "Authorization received. Filing your return."}
                {selectedTicket.stage === 'filing-completed' && "Your return has been filed successfully."}
                {selectedTicket.stage === 'closed' && "Your case is complete."}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No active cases found</p>
          )}
        </CardContent>
      </Card>

      {/* What You Need to Do Now */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle>What you need to do now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTicket.stage === 'pending-info' && (
              <>
                <p className="text-muted-foreground">Please upload your W-2s, 1099s, and deduction documents.</p>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </Button>
              </>
            )}
            {selectedTicket.stage === 'draft-sent' && (
              <>
                <p className="text-muted-foreground">Please review the draft documents and approve or request changes.</p>
                <Link href={`/client/cases/${selectedTicket.id}`}>
                  <Button>Review Draft</Button>
                </Link>
              </>
            )}
            {selectedTicket.stage === 'payment-received' && (
              <>
                <p className="text-muted-foreground">Thank you for payment. We're preparing final documents.</p>
              </>
            )}
            {selectedTicket.stage === '8879-sent' && (
              <>
                <p className="text-muted-foreground">Please sign Form 8879 and return it to us as soon as possible.</p>
                <Link href={`/client/cases/${selectedTicket.id}`}>
                  <Button>Review & Sign Form</Button>
                </Link>
              </>
            )}
            {(selectedTicket.stage === '8879-received' || selectedTicket.stage === 'filing-completed' || selectedTicket.stage === 'closed') && (
              <p className="text-muted-foreground">Your case is progressing as scheduled.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages from Tax Preparer */}
      {ticketMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages from your tax preparer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ticketMessages
                .filter(m => m.senderRole === 'employee')
                .slice(0, 3)
                .map(msg => (
                  <div key={msg.id} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm italic">"{msg.content}"</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
            {ticketMessages.length > 3 && (
              <Link href={`/client/cases/${selectedTicket.id}`}>
                <Button variant="outline" className="w-full mt-4">View All Messages</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Your Cases */}
      {clientTickets.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clientTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedTicket.id === ticket.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <p className="font-medium text-sm">Ticket #{ticket.id}</p>
                  <p className="text-xs opacity-75">{ticket.filingType} - {ticket.taxYear}</p>
                  <p className="text-xs opacity-75 mt-1">{TICKET_STAGES[ticket.stage]?.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
