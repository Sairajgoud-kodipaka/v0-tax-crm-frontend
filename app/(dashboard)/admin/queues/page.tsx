import { TICKET_STAGES } from '@/lib/constants';
import type { TicketStage } from '@/lib/types';
import { listTicketsForStage } from '@/lib/data/tickets-queries';
import { QueueTicketsTable } from '@/components/tickets/queue-tickets-table';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';

export default async function AdminQueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const selectedStage = (sp.stage as TicketStage) || 'pending-info';

  const filteredTickets = await listTicketsForStage(selectedStage, 'admin', '');
  const stageInfo = TICKET_STAGES[selectedStage];

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
