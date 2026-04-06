'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockTickets, mockMessages, mockEmployees } from '@/lib/mock-data';
import { TICKET_STAGES, PRIORITIES, TICKET_STATUSES } from '@/lib/constants';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, MessageSquare, FileText } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const id = (params as any).id || 'ticket-001';
  const ticket = mockTickets.find(t => t.id === id);
  const ticketMessages = mockMessages.filter(m => m.ticketId === id);
  const [newMessage, setNewMessage] = useState('');

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/admin/queues">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Queues
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/admin/queues">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Queues
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button className="bg-primary text-primary-foreground">Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <CardDescription>{ticket.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                  <p className="text-lg text-foreground">{ticket.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Filing Type</label>
                  <p className="text-lg text-foreground">{ticket.filingType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax Year</label>
                  <p className="text-lg text-foreground">{ticket.taxYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                  <p className="text-lg text-foreground">{ticket.assignedToName || 'Unassigned'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents ({ticket.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {ticket.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(doc.size / 1024)} KB</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages ({ticketMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ticketMessages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No messages yet</p>
                ) : (
                  ticketMessages.map((msg) => (
                    <div key={msg.id} className={`p-4 rounded-lg border ${msg.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-muted border-border'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">{msg.senderName}</p>
                          {msg.isInternal && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1 inline-block">Internal Note</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{msg.createdAt.toLocaleDateString()}</p>
                      </div>
                      <p className="mt-2 text-sm text-foreground">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* New Message */}
              <div className="pt-4 border-t border-border space-y-2">
                <Textarea
                  placeholder="Add a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline">Internal Note</Button>
                  <Button className="bg-primary text-primary-foreground">Send Message</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stage & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Current Stage</label>
                <div className={`px-3 py-2 rounded-lg text-sm font-medium mt-1 ${TICKET_STAGES[ticket.stage].color}`}>
                  {TICKET_STAGES[ticket.stage].label}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <div className="px-3 py-2 rounded-lg bg-muted text-sm font-medium mt-1 capitalize">
                  {ticket.status}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <div className={`px-3 py-2 rounded-lg text-sm font-medium mt-1 ${PRIORITIES[ticket.priority].color}`}>
                  {PRIORITIES[ticket.priority].label}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Created</label>
                <p className="text-sm text-foreground mt-1">{ticket.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Updated</label>
                <p className="text-sm text-foreground mt-1">{ticket.updatedAt.toLocaleDateString()}</p>
              </div>
              {ticket.dueDate && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                  <p className="text-sm text-foreground mt-1">{ticket.dueDate.toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Client Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-foreground">{ticket.clientName}</p>
                <p className="text-xs text-muted-foreground">{ticket.clientEmail}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
