'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockTickets } from '@/lib/mock-data';
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

export default function ClientDashboard() {
  const myCases = mockTickets.filter((t) => t.clientId === 'client-1');
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="gap-2 bg-primary text-primary-foreground">
              <Plus className="size-4" />
              Create New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Start a new tax service request. In a full product this would open your intake flow.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="yr">Tax year</Label>
                <Input id="yr" type="number" placeholder="2026" defaultValue={2026} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc">Service</Label>
                <Input id="svc" placeholder="e.g. US Individual Income Tax Filing" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Continue
              </Button>
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
                  No tickets yet. Create one to get started.
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
