'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TICKET_STAGES, STAGE_NAVIGATION } from '@/lib/constants';
import type { Ticket, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateStageFormAction } from '@/app/actions/forms';
import { StaffTicketCaseTabs } from '@/components/tickets/staff-ticket-case-tabs';
import { useTicketStageRealtime } from '@/hooks/use-ticket-stage-realtime';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { formatTicketLastUpdatedLine } from '@/lib/client-ui';
import { markTicketThreadReadAction } from '@/app/actions/thread-reads';
import { useAppStore } from '@/lib/store';
import { markTicketNotificationsReadAction } from '@/app/actions/notifications';

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
  initialTabFromUrl = null,
}: {
  ticket: Ticket;
  backHref: string;
  showAssignedCard: boolean;
  organizerAnswers?: Record<string, unknown>;
  viewerUserId: string;
  viewerName: string;
  viewerRole: UserRole;
  initialTabFromUrl?: string | null;
}) {
  const markTicketRead = useAppStore((s) => s.markTicketRead);
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

  useEffect(() => {
    void Promise.all([markTicketThreadReadAction(ticket.id), markTicketNotificationsReadAction(ticket.id)]).then(() => {
      markTicketRead(ticket.id);
    });
  }, [ticket.id, markTicketRead]);

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
          Use the Preparer Notes tab for internal team chat, mentions, and note actions.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update Stage</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form action={updateStageFormAction} className="flex flex-wrap items-end gap-1.5">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <div className="space-y-1 min-w-[140px]">
              <label htmlFor="toStage" className="text-[10px] text-muted-foreground">
                Stage
              </label>
              <select
                id="toStage"
                name="toStage"
                key={liveStage}
                defaultValue={liveStage}
                className="flex h-7 rounded-md border border-input bg-background px-2 py-0 text-xs"
              >
                {STAGE_NAVIGATION.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1 space-y-1">
              <label htmlFor="note" className="text-[10px] text-muted-foreground">
                Note
              </label>
              <input
                id="note"
                name="note"
                className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-0 text-xs"
                placeholder="Reason for change"
              />
            </div>
            <Button type="submit" size="sm" variant="default" className={cn('h-7 px-2.5 text-xs', ticketCaseBlackCtaButtonClassName)}>
              Save stage
            </Button>
          </form>
        </CardContent>
      </Card>

      <StaffTicketCaseTabs
        ticketRaw={ticketRaw}
        organizerAnswers={organizerAnswers}
        viewerUserId={viewerUserId}
        viewerName={viewerName}
        viewerRole={viewerRole}
        initialTabFromUrl={initialTabFromUrl}
      />
    </div>
  );
}
