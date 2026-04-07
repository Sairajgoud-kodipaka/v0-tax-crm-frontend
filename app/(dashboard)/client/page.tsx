import Link from 'next/link';
import {
  clientStatusPresentation,
  displayTicketRef,
  formatServiceDetails,
} from '@/lib/client-ui';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { listTicketsForClient, getSessionUser } from '@/lib/data/tickets-queries';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';
import { CreateTicketForm } from './create-ticket-form';
import { QueueRealtimeRefresh } from '@/components/realtime/queue-realtime-refresh';

export default async function ClientDashboard() {
  const session = await getSessionUser();
  if (!session) return null;

  const myCases = await listTicketsForClient(session.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <QueueRealtimeRefresh />
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="default" className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}>
              <Plus className="size-4" />
              Create New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                New cases are normally started when you sign up with your preparer&apos;s invitation link. Contact your
                preparer if you need another service.
              </DialogDescription>
            </DialogHeader>
            <CreateTicketForm />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[120px] font-semibold">Ticket ID</TableHead>
              <TableHead className="font-semibold">Service Details</TableHead>
              <TableHead className="w-[140px] text-right font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  No tickets yet. Use your invitation link from your tax preparer to start a case.
                </TableCell>
              </TableRow>
            ) : (
              myCases.map((ticket) => {
                const st = clientStatusPresentation(ticket);
                return (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/40">
                    <TableCell className="font-mono text-sm font-medium">
                      <Link href={`/client/cases/${ticket.id}`} className="text-primary hover:underline">
                        {displayTicketRef(ticket)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/client/cases/${ticket.id}`}
                        className="block text-foreground hover:text-primary"
                      >
                        {formatServiceDetails(ticket)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/client/cases/${ticket.id}`}>
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${st.className}`}
                        >
                          {st.label}
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
    </div>
  );
}
