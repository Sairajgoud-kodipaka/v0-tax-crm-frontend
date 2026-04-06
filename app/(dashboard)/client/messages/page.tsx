'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { mockTickets, mockMessages } from '@/lib/mock-data';
import { useState } from 'react';
import { Search, Send } from 'lucide-react';

export default function ClientMessagesPage() {
  const clientTickets = mockTickets.filter(t => t.clientId === 'client-1');
  const allMessages = clientTickets.flatMap(t =>
    mockMessages.filter(m => m.ticketId === t.id && !m.isInternal).map(msg => ({ ...msg, ticketSubject: t.subject }))
  );
  
  const [selectedTicket, setSelectedTicket] = useState<string | null>(clientTickets.length > 0 ? clientTickets[0].id : null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTicketMessages = mockMessages.filter(
    m => m.ticketId === selectedTicket && !m.isInternal
  );

  const filteredTickets = clientTickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with our team about your cases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Your Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No cases found</p>
              ) : (
                filteredTickets.map((ticket) => {
                  const caseMessages = mockMessages.filter(m => m.ticketId === ticket.id && !m.isInternal);
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedTicket === ticket.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {caseMessages.length} message{caseMessages.length !== 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedTicket
                ? clientTickets.find(t => t.id === selectedTicket)?.subject
                : 'Select a case'}
            </CardTitle>
            <CardDescription>
              {selectedTicket
                ? `Conversation with ${clientTickets.find(t => t.id === selectedTicket)?.assignedToName}`
                : 'Select a case to view messages'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTicket ? (
              <>
                {/* Messages */}
                <div className="space-y-3 max-h-96 overflow-y-auto bg-muted/30 p-4 rounded-lg">
                  {selectedTicketMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    selectedTicketMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'client-1' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.senderId === 'client-1'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card text-foreground border border-border'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === 'client-1' ? 'opacity-80' : 'text-muted-foreground'}`}>
                            {msg.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="space-y-2 border-t border-border pt-4">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-20 resize-none"
                  />
                  <Button className="w-full bg-primary text-primary-foreground gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a case from the list to view or send messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
