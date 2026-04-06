'use client';

import { use, useState } from 'react';
import { mockTickets, mockMessages, mockDocuments } from '@/lib/mock-data';
import { TICKET_STAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Send } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AdminTicketDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id || 'ticket-001';
  const ticket = mockTickets.find(t => t.id === id);
  const ticketMessages = mockMessages.filter(m => m.ticketId === id);
  const ticketDocs = mockDocuments.filter(d => d.ticketId === id);
  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Link href="/admin/queues">
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

  return (
    <div className="space-y-6">
      <Link href="/admin/queues">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Queues
        </Button>
      </Link>

      {/* Ticket Header */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ticket #{ticket.id}</h1>
            <p className="text-muted-foreground">Client: {ticket.clientName}</p>
          </div>
          <div className="text-right space-y-2">
            <p className="text-sm text-muted-foreground">Assigned: {ticket.assignedToName || 'Unassigned'}</p>
            <p className="text-sm text-muted-foreground">Updated: 2h ago</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Service</p>
            <p className="font-medium">{ticket.filingType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tax Year</p>
            <p className="font-medium">{ticket.taxYear}</p>
          </div>
          <div className="ml-auto">
            <select className="px-3 py-2 border rounded-lg text-sm font-medium">
              <option value={ticket.stage}>{stageInfo?.label || ticket.stage}</option>
              <option>Next Stage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="organizer">Tax Organizer</TabsTrigger>
          <TabsTrigger value="documents">Tax Documents</TabsTrigger>
          <TabsTrigger value="drafts">Tax Drafts</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="final">Final Docs</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - Client Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{ticket.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{ticket.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">Available</p>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">Current Stage</p>
                  <p className="font-medium">{stageInfo?.label}</p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-semibold">Assigned To</p>
                  <p className="font-medium">{ticket.assignedToName}</p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-semibold">Admin Actions</p>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    Reassign
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    Priority Override
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    Extend Deadline
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Conversation */}
            <div className="col-span-2 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4 max-h-96 overflow-y-auto">
                  {ticketMessages.map(msg => (
                    <div key={msg.id} className={`space-y-1 p-3 rounded-lg ${msg.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-muted'}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{msg.senderRole === 'employee' ? 'Employee' : 'Client'}: {msg.senderName}</p>
                        {msg.isInternal && <Badge variant="outline" className="text-xs">Internal</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground text-xs">{new Date(msg.createdAt).toLocaleString()}</p>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Message Input */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message here..."
                    className="w-full p-3 border rounded-lg text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-between items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                      Internal Note
                    </label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Clear</Button>
                      <Button size="sm" className="gap-2">
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tax Organizer Tab */}
        <TabsContent value="organizer">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - Section Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {['Personal Info', 'Filing Status', 'Dependents', 'Income Sources', 'Deductions', 'Bank Details', 'Review'].map((section, idx) => (
                    <Button key={section} variant={idx === 0 ? 'default' : 'outline'} className="w-full justify-start" size="sm">
                      {section}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Form Content (Read-only for admin) */}
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information (Read-Only View)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Full Name</label>
                    <p className="font-medium mt-1">{ticket.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">SSN</label>
                    <p className="font-medium mt-1">xxx-xx-1234</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Date of Birth</label>
                    <p className="font-medium mt-1">01/01/1990</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Filing Status</label>
                    <p className="font-medium mt-1">Single</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Dependents</label>
                    <p className="font-medium mt-1">2</p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm">Download PDF</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tax Documents Tab */}
        <TabsContent value="documents">
          <div className="grid grid-cols-2 gap-6">
            {/* Upload Area - Admin can upload on behalf */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Documents (Admin)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">📄 Upload W-2</Button>
                <Button variant="outline" className="w-full">📄 Upload 1099</Button>
                <Button variant="outline" className="w-full">📄 Upload Other Docs</Button>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground">Drag & drop files here</p>
                </div>
              </CardContent>
            </Card>

            {/* All Uploaded Files */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Uploaded Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticketDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.uploadedBy} {doc.uploadedAt}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tax Drafts Tab */}
        <TabsContent value="drafts">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Draft Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">- Draft Form 1040.pdf</p>
                  <p className="text-sm font-medium">- Schedule A.pdf</p>
                  <p className="text-sm font-medium">- Refund Summary.pdf</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground">Employee Notes:</p>
                  <p className="text-sm mt-2">"Please review estimated refund and deductions"</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Decision & Admin Override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <p className="font-medium">Awaiting Approval</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Admin Actions:</p>
                  <Button className="w-full" variant="default" size="sm">Override & Approve</Button>
                  <Button className="w-full" variant="outline" size="sm">Reject & Reassign</Button>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Admin Notes</label>
                  <textarea placeholder="Admin comments..." className="w-full px-3 py-2 border rounded-lg mt-2 text-sm resize-none" rows={4} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Summary & Payment Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{ticket.filingType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="font-semibold text-lg">$299</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">15 Apr 2026</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>Payment Received</Badge>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Confirmation #</p>
                <p className="font-medium">PAY-883728</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm">Download Receipt</Button>
                <Button variant="outline" size="sm">Send Reminder</Button>
                <Button variant="outline" size="sm">Mark as Overdue</Button>
                <Button size="sm">Move to 8879 Sent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Final Documents Tab */}
        <TabsContent value="final">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sent to Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">- Form_8879.pdf</p>
                  <p className="text-sm font-medium">- Filing_Instructions.pdf</p>
                </div>
                <Button variant="outline" className="w-full">Resend 8879</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Returned / Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">Awaiting signed form</p>
                </div>
                <Button className="w-full">Mark as Received</Button>
                <Button variant="outline" className="w-full">Send Reminder</Button>
                <Button variant="outline" className="w-full">File Return</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
