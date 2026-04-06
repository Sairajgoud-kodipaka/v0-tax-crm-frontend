'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTickets } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import Link from 'next/link';
import { FileText, MessageSquare, Clock } from 'lucide-react';

export default function ClientDashboard() {
  // Get tickets for current client (client-1)
  const myCases = mockTickets.filter(t => t.clientId === 'client-1');
  const activeCount = myCases.filter(t => t.stage !== 'closed').length;
  const completedCount = myCases.filter(t => t.stage === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{myCases.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All your tax cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully filed</p>
          </CardContent>
        </Card>
      </div>

      {/* My Cases */}
      <Card>
        <CardHeader>
          <CardTitle>My Tax Cases</CardTitle>
          <CardDescription>Your current and past tax return cases</CardDescription>
        </CardHeader>
        <CardContent>
          {myCases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You don&apos;t have any cases yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCases.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/client/cases/${ticket.id}`}
                  className="block p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground hover:text-primary">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{ticket.filingType} • Tax Year {ticket.taxYear}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          {ticket.documents.length} documents
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          Updates
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${TICKET_STAGES[ticket.stage].color}`}>
                        {TICKET_STAGES[ticket.stage].label}
                      </span>
                      {ticket.dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {ticket.dueDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card>
        <CardHeader>
          <CardTitle>The Tax Return Process</CardTitle>
          <CardDescription>Here&apos;s how your case progresses through our system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { stage: 'Intake', description: 'Initial information gathering and client setup' },
              { stage: 'Document Collection', description: 'Upload your W2s, 1099s, and other documents' },
              { stage: 'Review', description: 'Our team reviews your documents for completeness' },
              { stage: 'Preparation', description: 'Your tax return is prepared and reviewed' },
              { stage: 'Filing', description: 'Your return is filed with the IRS' },
              { stage: 'Follow-up', description: 'Confirmation and any necessary follow-up' },
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{step.stage}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Need Help */}
      <Card className="bg-secondary/10 border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground mb-4">
            Have questions about your case? Our team is here to help. Send us a message through your case details or contact us directly.
          </p>
          <div className="flex gap-2">
            <Link href="/client/messages" className="text-sm font-medium text-primary hover:underline">
              Message Support
            </Link>
            <span className="text-muted-foreground">•</span>
            <a href="tel:5551234567" className="text-sm font-medium text-primary hover:underline">
              Call (555) 123-4567
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
