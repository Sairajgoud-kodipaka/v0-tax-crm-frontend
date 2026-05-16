import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { TICKET_STAGES } from '@/lib/constants';
import type { TicketStage } from '@/lib/types';
import { getSessionUser, listTicketsForStage } from '@/lib/data/tickets-queries';
import { QueueTicketsTable } from '@/components/tickets/queue-tickets-table';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';

const DEFAULT_QUEUE_STAGE: TicketStage = 'pending-info';

function QueueSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded bg-muted mb-2" />
        <div className="h-4 w-72 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted mt-2" />
      </div>
      <div className="rounded-md border border-border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function QueueContent({ stage, sessionId }: { stage: TicketStage; sessionId: string }) {
  const filteredTickets = await listTicketsForStage(stage, 'employee', sessionId);
  const stageInfo = TICKET_STAGES[stage];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <QueueRealtimeRefresh />
      <div>
        <h1 className="mb-2 text-3xl font-bold">{stageInfo.label}</h1>
        <p className="text-muted-foreground">{stageInfo.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} in this stage (team
          queue)
        </p>
      </div>
      <QueueTicketsTable
        tickets={filteredTickets}
        ticketBasePath="/employee/tickets"
        emptyMessage="No tickets in this stage yet."
      />
    </div>
  );
}

export default async function EmployeeQueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const stageParam = sp.stage;
  const stageIsValid = Boolean(stageParam && stageParam in TICKET_STAGES);

  if (!stageParam) redirect(`/employee/queues?stage=${DEFAULT_QUEUE_STAGE}`);
  if (!stageIsValid) redirect(`/employee/queues?stage=${DEFAULT_QUEUE_STAGE}`);

  const selectedStage = stageParam as TicketStage;
  const session = await getSessionUser();
  if (!session || session.role !== 'employee') return null;

  return (
    <Suspense key={selectedStage} fallback={<QueueSkeleton />}>
      <QueueContent stage={selectedStage} sessionId={session.id} />
    </Suspense>
  );
}
