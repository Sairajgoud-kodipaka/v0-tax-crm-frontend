import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ClientCaseTabs } from '@/components/client/client-case-tabs';
import { ChevronLeft } from 'lucide-react';
import { getTaxOrganizerAnswersAction } from '@/app/actions/organizer';
import { getSessionUser, getTicketForClientCase } from '@/lib/data/tickets-queries';

export default async function ClientCaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const session = await getSessionUser();
  if (!session || session.role !== 'client') notFound();

  const [ticket, organizerAnswers] = await Promise.all([
    getTicketForClientCase(id, session.id),
    getTaxOrganizerAnswersAction(id),
  ]);
  if (!ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground">
          <Link href="/client">
            <ChevronLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
      </div>
    );
  }

  const ticketRaw = JSON.parse(JSON.stringify(ticket)) as Record<string, unknown>;
  const ticketActivities = JSON.parse(JSON.stringify(ticket.activities ?? [])) as Record<string, unknown>[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Button variant="ghost" asChild className="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground">
        <Link href="/client">
          <ChevronLeft className="size-4" />
          Back to Home
        </Link>
      </Button>
      <ClientCaseTabs
        ticketRaw={ticketRaw}
        ticketActivities={ticketActivities}
        organizerAnswers={organizerAnswers}
        viewerUserId={session.id}
        viewerName={session.name}
        viewerRole={session.role}
        initialTabFromUrl={sp.tab ?? null}
      />
    </div>
  );
}
