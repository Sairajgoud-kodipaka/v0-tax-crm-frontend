'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Ticket } from '@/lib/types';
import { mockMessages } from '@/lib/mock-data';
import { clientStatusPresentation, displayTicketRef } from '@/lib/client-ui';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload } from 'lucide-react';
import { TaxOrganizerPanel } from '@/components/client/tax-organizer-panel';
import { cn } from '@/lib/utils';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function ticketTitleLine(ticket: Ticket): string {
  const filing =
    ticket.filingType === 'Individual 1040'
      ? 'US Individual Income Tax Filing'
      : ticket.filingType;
  return `${ticket.taxYear} ${filing}`;
}

function ticketHeaderTitle(ref: string, ticket: Ticket): string {
  return `Ticket #${ref} - ${ticketTitleLine(ticket)}`;
}

export function ClientCaseTabs({ ticket }: { ticket: Ticket }) {
  const ref = displayTicketRef(ticket);
  const status = clientStatusPresentation(ticket);
  const [message, setMessage] = useState('');
  const messages = useMemo(
    () => mockMessages.filter((m) => m.ticketId === ticket.id && !m.isInternal),
    [ticket.id],
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {ticketHeaderTitle(ref, ticket)}
        </h1>
        <span
          className={cn(
            'inline-flex w-fit items-center rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-900',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <Tabs defaultValue="messages" className="gap-0">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-border bg-zinc-950 p-0 text-zinc-300">
          {(
            [
              ['messages', 'Messages'],
              ['organizer', 'Tax Organizer'],
              ['documents', 'My Documents'],
              ['drafts', 'Tax Drafts'],
              ['invoices', 'Invoices'],
              ['final', 'Final Documents'],
            ] as const
          ).map(([id, label]) => (
            <TabsTrigger
              key={id}
              value={id}
              className={cn(
                'rounded-none border-t-4 border-transparent border-b-2 border-b-transparent px-4 py-3 text-sm font-medium text-zinc-400',
                'data-[state=active]:border-t-amber-400 data-[state=active]:border-b-amber-500 data-[state=active]:bg-amber-400 data-[state=active]:text-zinc-900',
              )}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="messages" className="mt-0 border-0 p-0">
          <div className="flex min-h-[360px] flex-col border-t border-border bg-background">
            <ScrollArea className="flex-1 p-4">
              <div className="min-h-[240px] space-y-3 pr-2">
                {messages.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No messages yet. Your conversation with the team will appear here.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-sm',
                        msg.senderId === ticket.clientId
                          ? 'ml-8 border-primary/30 bg-primary/5'
                          : 'mr-8 border-border bg-muted/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-foreground">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border p-4">
              <Textarea
                placeholder="Type your message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[88px] resize-none bg-background"
              />
              <div className="mt-3 flex justify-end">
                <Button type="button" className="bg-primary text-primary-foreground">
                  Send
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizer" className="mt-0 border-0 p-0">
          <TaxOrganizerPanel />
        </TabsContent>

        <TabsContent value="documents" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">
                My Uploaded Documents
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                    <TableHead className="w-[100px] text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticket.documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ticket.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {doc.uploadedAt.toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={doc.url} target="_blank" rel="noreferrer">
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" className="gap-2">
              <Upload className="size-4" />
              Upload New Document
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">
                Tax Return Drafts
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Shared</TableHead>
                    <TableHead className="w-[120px] text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!ticket.drafts || ticket.drafts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No drafts shared yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {ticket.drafts?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {d.sharedAt.toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" type="button">
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground">
              Review drafts shared by your tax team. Final filing copies appear under Final Documents.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Invoices</div>
              <div className="divide-y divide-border">
                {(!ticket.invoices || ticket.invoices.length === 0) && (
                  <p className="p-6 text-sm text-muted-foreground">No invoices for this ticket.</p>
                )}
                {ticket.invoices?.map((inv) => (
                  <div key={inv.id} className="space-y-3 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{inv.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {usd.format(inv.amountCents / 100)}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-950',
                          )}
                        >
                          {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inv.status === 'unpaid' && inv.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {inv.dueDate.toLocaleDateString()}
                        </span>
                      )}
                      {inv.status === 'paid' && inv.paidAt && (
                        <span className="text-xs text-muted-foreground">
                          Paid on {inv.paidAt.toLocaleDateString()}
                        </span>
                      )}
                      <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" type="button">
                          View
                        </Button>
                        {inv.status === 'unpaid' && (
                          <Button size="sm" type="button" className="bg-primary text-primary-foreground">
                            Pay
                          </Button>
                        )}
                        {inv.status === 'paid' && (
                          <Button variant="ghost" size="sm" type="button">
                            View receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Questions about billing? Use Messages to contact your team.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="final" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">
                Final filing package
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden sm:table-cell">Available</TableHead>
                    <TableHead className="w-[120px] text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!ticket.finalDocuments || ticket.finalDocuments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        Final documents will appear here once your return is completed.
                      </TableCell>
                    </TableRow>
                  )}
                  {ticket.finalDocuments?.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {f.availableAt
                          ? f.availableAt.toLocaleDateString(undefined, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" type="button">
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground">
              Official completed documents for this ticket once filing is finalized.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
