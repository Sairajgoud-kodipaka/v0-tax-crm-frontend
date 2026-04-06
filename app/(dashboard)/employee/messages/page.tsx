'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { mockTickets, mockMessages } from '@/lib/mock-data';
import { useAuthStore } from '@/lib/store';
import { useState, useMemo } from 'react';
import { Search, Send } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeMessagesPage() {
  const { user } = useAuthStore();

  const myTickets = useMemo(
    () => mockTickets.filter((t) => t.assignedToId === user?.id),
    [user?.id],
  );

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    myTickets.length > 0 ? myTickets[0].id : null,
  );
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedMessages = useMemo(
    () => mockMessages.filter((m) => m.ticketId === selectedTicketId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [selectedTicketId],
  );

  const selectedTicket = myTickets.find((t) => t.id === selectedTicketId);

  const filteredTickets = myTickets.filter((t) =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Chat with clients on tickets assigned to you. For full case context, open the{' '}
          <Link href="/employee/queues?stage=pending-info" className="text-primary underline underline-offset-2">
            queue
          </Link>{' '}
          or ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">My cases</CardTitle>
            <CardDescription>Tickets where you are the assignee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by case or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <div className="max-h-96 space-y-1 overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {myTickets.length === 0
                    ? 'No tickets assigned to you yet.'
                    : 'No cases match your search.'}
                </p>
              ) : (
                filteredTickets.map((ticket) => {
                  const count = mockMessages.filter((m) => m.ticketId === ticket.id).length;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedTicketId === ticket.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{ticket.clientName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {count} message{count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>
                  {selectedTicket ? selectedTicket.subject : 'Select a case'}
                </CardTitle>
                <CardDescription>
                  {selectedTicket
                    ? `Client: ${selectedTicket.clientName} · Ticket #${selectedTicket.shortCode ?? selectedTicket.id}`
                    : 'Pick a case from the list to view the thread'}
                </CardDescription>
              </div>
              {selectedTicket && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/employee/tickets/${selectedTicket.id}`}>Open ticket</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTicketId && selectedTicket ? (
              <>
                <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-4">
                  {selectedMessages.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    </div>
                  ) : (
                    selectedMessages.map((msg) => {
                      const isClient = msg.senderRole === 'client';
                      const isInternal = msg.isInternal;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[min(100%,20rem)] rounded-lg px-4 py-2 ${
                              isInternal
                                ? 'border border-dashed border-amber-500/60 bg-amber-500/10 text-foreground'
                                : isClient
                                  ? 'border border-border bg-card text-foreground'
                                  : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium opacity-90">{msg.senderName}</span>
                              {isInternal && (
                                <Badge variant="outline" className="text-[10px]">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isInternal
                                  ? 'text-muted-foreground'
                                  : isClient
                                    ? 'text-muted-foreground'
                                    : 'opacity-80'
                              }`}
                            >
                              {msg.createdAt.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Textarea
                    placeholder="Reply to the client (demo — not saved)..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-20 resize-none"
                  />
                  <Button className="w-full gap-2 bg-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                    Send message
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Select a case to view messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
