import { redirect } from 'next/navigation';
import { TICKET_STAGES } from '@/lib/constants';
import type { TicketStage } from '@/lib/types';
import { getSessionUser, listTicketsForStage } from '@/lib/data/tickets-queries';
import { QueueTicketsTable } from '@/components/tickets/queue-tickets-table';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';

const DEFAULT_QUEUE_STAGE: TicketStage = 'pending-info';

export default async function EmployeeQueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const stageParam = sp.stage;
  const stageIsValid = Boolean(stageParam && stageParam in TICKET_STAGES);

  if (!stageParam) {
    redirect(`/employee/queues?stage=${DEFAULT_QUEUE_STAGE}`);
  }
  if (!stageIsValid) {
    redirect(`/employee/queues?stage=${DEFAULT_QUEUE_STAGE}`);
  }

  const selectedStage = stageParam as TicketStage;
  const session = await getSessionUser();
  if (!session || session.role !== 'employee') return null;

  const filteredTickets = await listTicketsForStage(selectedStage, 'employee', session.id);
  const stageInfo = TICKET_STAGES[selectedStage];

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
