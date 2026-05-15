import { notFound } from 'next/navigation';
import { getTaxOrganizerAnswersAction } from '@/app/actions/organizer';
import { getSessionUser, getTicketDetailBundle } from '@/lib/data/tickets-queries';
import { StaffTicketDetail } from '@/components/tickets/staff-ticket-detail';

export default async function EmployeeTicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const session = await getSessionUser();
  if (!session || session.role !== 'employee') notFound();

  const [ticket, organizerAnswers] = await Promise.all([
    getTicketDetailBundle(id, 'employee', session.id),
    getTaxOrganizerAnswersAction(id),
  ]);
  if (!ticket) notFound();

  return (
    <StaffTicketDetail
      ticket={ticket}
      backHref="/employee/queues?stage=pending-info"
      showAssignedCard={false}
      organizerAnswers={organizerAnswers}
      viewerUserId={session.id}
      viewerName={session.name}
      viewerRole={session.role}
      initialTabFromUrl={sp.tab ?? null}
    />
  );
}
