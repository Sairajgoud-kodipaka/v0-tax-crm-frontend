import Link from 'next/link';
import { TICKET_STATUSES } from '@/lib/constants';
import { displayTicketRef, formatServiceDetails } from '@/lib/client-ui';
import type { Ticket } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TicketUnreadDot } from '@/components/tickets/ticket-unread-dot';

function statusBadgeClass(status: Ticket['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-muted text-foreground border border-border';
    case 'on-hold':
      return 'bg-muted text-muted-foreground border border-border';
    case 'in-progress':
      return 'bg-primary/10 text-primary border border-primary/25';
    case 'pending':
      return 'bg-secondary text-secondary-foreground border border-secondary/80';
    case 'open':
    default:
      return 'bg-secondary text-secondary-foreground border border-secondary/80';
  }
}

/** Staff queue: same columns as client home — ID, service line, ticket status (open / in progress / …). */
export function QueueTicketsTable({
  tickets,
  ticketBasePath,
  emptyMessage,
}: {
  tickets: Ticket[];
  /** e.g. `/admin/tickets` or `/employee/tickets` — no trailing slash */
  ticketBasePath: string;
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[120px] font-semibold">Ticket ID</TableHead>
            <TableHead className="font-semibold">Service Details</TableHead>
            <TableHead className="w-[160px] text-right font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => {
              const href = `${ticketBasePath}/${ticket.id}`;
              const statusLabel = TICKET_STATUSES[ticket.status]?.label ?? ticket.status;
              const statusUpper = statusLabel.toUpperCase();
              return (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell className="font-mono text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <TicketUnreadDot ticketId={ticket.id} />
                      <Link href={href} className="text-primary hover:underline">
                        {displayTicketRef(ticket)}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={href} className="block text-foreground hover:text-primary">
                      {formatServiceDetails(ticket)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={href}>
                      <span
                        className={cn(
                          'inline-flex rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                          statusBadgeClass(ticket.status),
                        )}
                      >
                        {statusUpper}
                      </span>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
