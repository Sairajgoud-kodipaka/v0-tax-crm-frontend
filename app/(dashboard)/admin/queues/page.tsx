import { Suspense } from 'react';
import { TICKET_STAGES } from '@/lib/constants';
import type { TicketStage } from '@/lib/types';
import { listTicketsForStage } from '@/lib/data/tickets-queries';
import { QueueTicketsTable } from '@/components/tickets/queue-tickets-table';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';

function QueueSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded bg-muted mb-2" />
        <div className="h-4 w-72 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted mt-2" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function QueueContent({ stage }: { stage: TicketStage }) {
  const filteredTickets = await listTicketsForStage(stage, 'admin', '');
  const stageInfo = TICKET_STAGES[stage];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <QueueRealtimeRefresh />
      <div>
        <h1 className="mb-2 text-3xl font-bold">{stageInfo.label}</h1>
        <p className="text-muted-foreground">{stageInfo.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} in this stage (all
          employees)
        </p>
      </div>
      <QueueTicketsTable
        tickets={filteredTickets}
        ticketBasePath="/admin/tickets"
        emptyMessage="No tickets in this stage yet."
      />
    </div>
  );
}

export default async function AdminQueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const selectedStage = (sp.stage as TicketStage) || 'pending-info';

  return (
    <Suspense key={selectedStage} fallback={<QueueSkeleton />}>
      <QueueContent stage={selectedStage} />
    </Suspense>
  );
}
