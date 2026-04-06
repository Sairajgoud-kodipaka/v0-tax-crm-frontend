'use client';

import { use, useState } from 'react';
import { mockTickets, mockMessages } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, MessageCircle, Clock, User } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id || 'ticket-001';
  const ticket = mockTickets.find(t => t.id === id);
  const ticketMessages = mockMessages.filter(m => m.ticketId === id);
  const [newMessage, setNewMessage] = useState('');

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Link href="/employee/queues">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Queues
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stageInfo = TICKET_STAGES[ticket.stage];
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/employee/queues">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Queues
        </Button>
      </Link>

      {/* Ticket Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>ID: {ticket.id}</span>
          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
          <span>Tax Year: {ticket.taxYear}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="capitalize">{ticket.status}</Badge>
          </CardContent>
        </Card>

        {/* Priority Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getPriorityColor(ticket.priority) as any} className="capitalize">
              {ticket.priority}
            </Badge>
          </CardContent>
        </Card>

        {/* Stage Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{stageInfo.label}</p>
          </CardContent>
        </Card>

        {/* Due Date Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">
              {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client Name</p>
              <p className="font-medium">{ticket.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{ticket.clientEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Filing Type</p>
              <p className="font-medium">{ticket.filingType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax Year</p>
              <p className="font-medium">{ticket.taxYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Documents */}
      {ticket.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents ({ticket.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticket.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024).toFixed(0)} KB • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Messages & Notes ({ticketMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticketMessages.map(msg => (
              <div key={msg.id} className={`p-3 rounded-lg ${msg.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{msg.senderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {msg.isInternal && '[Internal] '}
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{msg.senderRole}</Badge>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}

            {/* Add Message */}
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add a client message or internal note..."
                  className="w-full p-2 border rounded-lg text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Send Message</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
