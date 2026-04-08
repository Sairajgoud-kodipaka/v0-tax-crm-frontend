import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data/tickets-queries';
import { NotificationsFullPage } from '@/components/notifications/notifications-full-page';

export default async function ClientNotificationsPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'client') redirect('/client');
  return <NotificationsFullPage userId={session.id} role={session.role} />;
}
