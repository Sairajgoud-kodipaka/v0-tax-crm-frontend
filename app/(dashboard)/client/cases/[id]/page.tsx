'use client';

import { use } from 'react';
import Link from 'next/link';
import { mockTickets } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { ClientCaseTabs } from '@/components/client/client-case-tabs';
import { ChevronLeft } from 'lucide-react';

export default function ClientCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ticket = mockTickets.find((t) => t.id === id && t.clientId === 'client-1');

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Button variant="ghost" asChild className="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground">
        <Link href="/client">
          <ChevronLeft className="size-4" />
          Back to Home
        </Link>
      </Button>
      <ClientCaseTabs ticket={ticket} />
    </div>
  );
}
