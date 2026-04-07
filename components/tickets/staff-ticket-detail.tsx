import Link from 'next/link';
import { TICKET_STAGES, STAGE_NAVIGATION } from '@/lib/constants';
import type { Ticket } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, MessageCircle } from 'lucide-react';
import { sendStaffMessageFormAction, updateStageFormAction } from '@/app/actions/forms';

function priorityVariant(priority: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (priority) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
}

export function StaffTicketDetail({
  ticket,
  backHref,
  showAssignedCard,
}: {
  ticket: Ticket;
  backHref: string;
  showAssignedCard: boolean;
}) {
  const stageInfo = TICKET_STAGES[ticket.stage];
  const ticketMessages = ticket.messages ?? [];

  return (
    <div className="space-y-6">
      <Link href={backHref}>
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Queues
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>ID: {ticket.shortCode ?? ticket.id}</span>
          <span>Created: {ticket.createdAt.toLocaleDateString()}</span>
          <span>Tax Year: {ticket.taxYear}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update stage</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateStageFormAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <div className="space-y-1">
              <label htmlFor="toStage" className="text-sm text-muted-foreground">
                New stage
              </label>
              <select
                id="toStage"
                name="toStage"
                defaultValue={ticket.stage}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {STAGE_NAVIGATION.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label htmlFor="note" className="text-sm text-muted-foreground">
                Note (optional)
              </label>
              <input
                id="note"
                name="note"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder="Reason for change"
              />
            </div>
            <Button type="submit">Save stage</Button>
          </form>
        </CardContent>
      </Card>

      <div className={`grid gap-4 ${showAssignedCard ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="capitalize">
              {ticket.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={priorityVariant(ticket.priority)} className="capitalize">
              {ticket.priority}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{stageInfo.label}</p>
          </CardContent>
        </Card>

        {showAssignedCard && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-sm">{ticket.assignedToName || 'Unassigned'}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">
              {ticket.dueDate ? ticket.dueDate.toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{ticket.description}</p>
        </CardContent>
      </Card>

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
              {ticket.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024).toFixed(0)} KB • Uploaded by {doc.uploadedBy} on{' '}
                      {doc.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Messages & Notes ({ticketMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticketMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${msg.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{msg.senderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {msg.isInternal && '[Internal] '}
                      {msg.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {msg.senderRole}
                  </Badge>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t">
              <form action={sendStaffMessageFormAction} className="space-y-2">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <textarea
                  name="body"
                  placeholder="Add a client message or internal note..."
                  className="w-full p-2 border rounded-lg text-sm resize-none"
                  rows={3}
                  required
                />
                <div className="flex items-center gap-3 justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="internal" />
                    Internal note
                  </label>
                  <Button type="submit" size="sm">
                    Send Message
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stage History</CardTitle>
        </CardHeader>
        <CardContent>
          {(ticket.history ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {(ticket.history ?? []).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{entry.actorName}</span>
                    <span className="text-muted-foreground">changed stage</span>
                    <Badge variant="outline">{entry.fromStage ? TICKET_STAGES[entry.fromStage].label : 'Created'}</Badge>
                    <span className="text-muted-foreground">to</span>
                    <Badge>{TICKET_STAGES[entry.toStage].label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.createdAt.toLocaleString()}</p>
                  {entry.note && <p className="mt-2 text-sm">{entry.note}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
