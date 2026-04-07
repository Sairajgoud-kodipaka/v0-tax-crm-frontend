import { notFound } from 'next/navigation';
import { getTaxOrganizerAnswersAction } from '@/app/actions/organizer';
import { getSessionUser, getTicketDetailBundle } from '@/lib/data/tickets-queries';
import { StaffTicketDetail } from '@/components/tickets/staff-ticket-detail';

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session || session.role !== 'admin') notFound();

  const ticket = await getTicketDetailBundle(id, 'admin', session.id);
  if (!ticket) notFound();

  const organizerAnswers = await getTaxOrganizerAnswersAction(id);

  return (
    <StaffTicketDetail
      ticket={ticket}
      backHref="/admin/queues?stage=pending-info"
      showAssignedCard
      organizerAnswers={organizerAnswers}
      viewerUserId={session.id}
      viewerName={session.name}
      viewerRole={session.role}
    />
  );
}
