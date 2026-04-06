'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { mockTickets, mockMessages } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, Upload, MessageSquare, FileText, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientCaseDetailPage({ params }: PageProps) {
  const id = (params as any).id || 'ticket-001';
  const ticket = mockTickets.find(t => t.id === id && t.clientId === 'client-1');
  const ticketMessages = mockMessages.filter(m => m.ticketId === id && !m.isInternal);
  const [newMessage, setNewMessage] = useState('');

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/client">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to My Cases
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Case not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button variant="outline" asChild>
        <Link href="/client">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to My Cases
        </Link>
      </Button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Case Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <CardDescription>{ticket.filingType} • Tax Year {ticket.taxYear}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <label className="text-sm font-medium text-foreground">Case Progress</label>
                <div className="mt-2 space-y-2">
                  {[
                    { stage: 'intake', label: 'Intake' },
                    { stage: 'document-collection', label: 'Documents' },
                    { stage: 'review', label: 'Review' },
                    { stage: 'preparation', label: 'Preparation' },
                    { stage: 'filing', label: 'Filing' },
                    { stage: 'closed', label: 'Complete' },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          ['intake', 'document-collection', 'review', 'preparation', 'filing'].includes(ticket.stage)
                            ? ['intake', 'document-collection', 'review', 'preparation', 'filing'].indexOf(ticket.stage) >=
                              ['intake', 'document-collection', 'review', 'preparation', 'filing'].indexOf(item.stage as any)
                              ? 'bg-primary'
                              : 'bg-muted'
                            : 'bg-muted'
                        }`}
                      />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${TICKET_STAGES[ticket.stage].color}`}>
                  Current Stage: {TICKET_STAGES[ticket.stage].label}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </CardTitle>
              <CardDescription>Uploaded files for your case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.documents.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload your documents to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ticket.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{Math.round(doc.size / 1024)} KB • {doc.uploadedAt.toLocaleDateString()}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {ticket.stage === 'document-collection' && (
                  <Button className="w-full gap-2 bg-primary text-primary-foreground">
                    <Upload className="w-4 h-4" />
                    Upload More Documents
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages with Our Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ticketMessages.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No messages yet. Send one to get started!</p>
                ) : (
                  ticketMessages.map((msg) => (
                    <div key={msg.id} className={`p-4 rounded-lg border ${msg.senderId === 'client-1' ? 'bg-primary/10 border-primary/30 ml-8' : 'bg-muted border-border'}`}>
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-foreground">{msg.senderName}</p>
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
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-20"
                />
                <Button className="w-full bg-primary text-primary-foreground">Send Message</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Case Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Assigned Accountant</label>
                <p className="text-foreground mt-1">{ticket.assignedToName || 'Not assigned'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Filing Type</label>
                <p className="text-foreground mt-1">{ticket.filingType}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tax Year</label>
                <p className="text-foreground mt-1">{ticket.taxYear}</p>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Started</label>
                <p className="text-foreground mt-1">{ticket.createdAt.toLocaleDateString()}</p>
              </div>
              {ticket.dueDate && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Due By</label>
                  <p className="text-foreground mt-1">{ticket.dueDate.toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          {ticket.stage !== 'closed' && (
            <Card className="bg-secondary/10 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-sm text-secondary">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 list-disc list-inside text-foreground">
                  {ticket.stage === 'intake' && (
                    <li>Complete intake questionnaire</li>
                  )}
                  {ticket.stage === 'document-collection' && (
                    <li>Upload all required documents</li>
                  )}
                  {ticket.stage === 'review' && (
                    <li>Wait for our team to review documents</li>
                  )}
                  {ticket.stage === 'preparation' && (
                    <li>Our accountant is preparing your return</li>
                  )}
                  {ticket.stage === 'filing' && (
                    <li>Your return will be filed soon</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
