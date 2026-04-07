'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TICKET_STAGES, STAGE_NAVIGATION } from '@/lib/constants';
import type { Ticket, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateStageFormAction } from '@/app/actions/forms';
import { StaffTicketCaseTabs } from '@/components/tickets/staff-ticket-case-tabs';
import { useTicketStageRealtime } from '@/hooks/use-ticket-stage-realtime';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { formatTicketLastUpdatedLine } from '@/lib/client-ui';

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
  organizerAnswers = {},
  viewerUserId,
  viewerName,
  viewerRole,
}: {
  ticket: Ticket;
  backHref: string;
  showAssignedCard: boolean;
  organizerAnswers?: Record<string, unknown>;
  viewerUserId: string;
  viewerName: string;
  viewerRole: UserRole;
}) {
  const { stage: liveStage, lastUpdatedAt } = useTicketStageRealtime(
    ticket.id,
    ticket.stage,
    ticket.updatedAt,
  );
  const stageInfo = TICKET_STAGES[liveStage];
  const ticketRaw = useMemo(() => {
    const base = JSON.parse(JSON.stringify(ticket)) as Record<string, unknown>;
    base.stage = liveStage;
    base.updatedAt = lastUpdatedAt.toISOString();
    return base;
  }, [ticket, liveStage, lastUpdatedAt]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-4">
        <Link href={backHref}>
          <Button
            size="icon"
            className={cn('h-11 w-11 shrink-0 rounded-full shadow-sm', ticketCaseBlackCtaButtonClassName)}
            variant="default"
            aria-label="Back to queues"
          >
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <p className="pt-2 text-sm text-muted-foreground">
          Same tabbed layout as the client portal — Messages, Tax Organizer (with sections), documents, drafts,
          invoices, and final documents.
        </p>
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
                key={liveStage}
                defaultValue={liveStage}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {STAGE_NAVIGATION.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-1 space-y-1">
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
            <Button type="submit" variant="default" className={ticketCaseBlackCtaButtonClassName}>
              Save stage
            </Button>
          </form>
        </CardContent>
      </Card>

      {ticket.description?.trim() && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{ticket.description}</p>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-4 ${showAssignedCard ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
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
            <p className="text-sm font-semibold">{stageInfo.label}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatTicketLastUpdatedLine(lastUpdatedAt)}
            </p>
          </CardContent>
        </Card>

        {showAssignedCard && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">{ticket.assignedToName || 'Unassigned'}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {ticket.dueDate ? ticket.dueDate.toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <StaffTicketCaseTabs
        ticketRaw={ticketRaw}
        organizerAnswers={organizerAnswers}
        viewerUserId={viewerUserId}
        viewerName={viewerName}
        viewerRole={viewerRole}
      />
    </div>
  );
}
