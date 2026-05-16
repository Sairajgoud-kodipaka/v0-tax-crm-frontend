'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TICKET_STAGES, STAGE_NAVIGATION } from '@/lib/constants';
import type { Ticket, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
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

      <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
        <form action={updateStageFormAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Update stage
          </span>
          <FormSelect
            key={liveStage}
            id="toStage"
            name="toStage"
            defaultValue={liveStage}
            size="sm"
            options={STAGE_NAVIGATION.map((s) => ({ value: s.id, label: s.label }))}
            triggerClassName="h-8 w-[11rem] shrink-0 text-xs"
          />
          <Input
            id="note"
            name="note"
            aria-label="Note"
            className="h-8 min-w-[8rem] flex-1 text-xs"
            placeholder="Note (optional)"
          />
          <Button
            type="submit"
            size="sm"
            variant="default"
            className={cn('h-8 shrink-0 px-3 text-xs', ticketCaseBlackCtaButtonClassName)}
          >
            Save stage
          </Button>
        </form>
      </div>

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
