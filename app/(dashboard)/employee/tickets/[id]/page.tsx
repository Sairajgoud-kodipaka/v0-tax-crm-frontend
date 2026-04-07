import { notFound } from 'next/navigation';
import { getTaxOrganizerAnswersAction } from '@/app/actions/organizer';
import { getSessionUser, getTicketDetailBundle } from '@/lib/data/tickets-queries';
import { StaffTicketDetail } from '@/components/tickets/staff-ticket-detail';

export default async function EmployeeTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session || session.role !== 'employee') notFound();

  const ticket = await getTicketDetailBundle(id, 'employee', session.id);
  if (!ticket) notFound();

  const organizerAnswers = await getTaxOrganizerAnswersAction(id);

  return (
    <StaffTicketDetail
      ticket={ticket}
      backHref="/employee/queues?stage=pending-info"
      showAssignedCard={false}
      organizerAnswers={organizerAnswers}
      viewerUserId={session.id}
      viewerName={session.name}
      viewerRole={session.role}
    />
  );
}
