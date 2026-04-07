'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTicketMessagesRealtime } from '@/hooks/use-ticket-messages-realtime';
import { TicketDetailDataRefresh } from '@/components/realtime/ticket-detail-data-refresh';
import { clientStatusPresentation, displayTicketRef, formatTicketLastUpdatedLine } from '@/lib/client-ui';
import { hydrateTicket } from '@/lib/data/hydrate-ticket';
import {
  sendStaffMessageFormAction,
  staffUploadDraftFormAction,
  staffUploadInvoiceFileFormAction,
  staffUploadFinalPackageFormAction,
} from '@/app/actions/forms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { TaxOrganizerPanel } from '@/components/client/tax-organizer-panel';
import {
  ticketCaseBlackCtaButtonClassName,
  ticketCasePrimaryTabTriggerClassName,
  ticketCasePrimaryTabsListClassName,
} from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';
import { useTicketReadReceipts, readReceiptLabel } from '@/hooks/use-ticket-read-receipts';
import { useTicketPresenceTyping } from '@/hooks/use-ticket-presence-typing';
import type { UserRole } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function ticketTitleLine(ticket: ReturnType<typeof hydrateTicket>): string {
  const filing =
    ticket.filingType === 'Individual 1040'
      ? 'US Individual Income Tax Filing'
      : ticket.filingType;
  return `${ticket.taxYear} ${filing}`;
}

function ticketHeaderTitle(ref: string, ticket: ReturnType<typeof hydrateTicket>): string {
  return `Ticket #${ref} - ${ticketTitleLine(ticket)}`;
}

/** Same tabbed shell as the client case view — Messages, Tax Organizer (3-level layout), documents, drafts, invoices, final. */
export function StaffTicketCaseTabs({
  ticketRaw,
  organizerAnswers = {},
  viewerUserId,
  viewerName,
  viewerRole,
}: {
  ticketRaw: Record<string, unknown>;
  organizerAnswers?: Record<string, unknown>;
  viewerUserId: string;
  viewerName: string;
  viewerRole: UserRole;
}) {
  const caseTabs = [
    ['messages', 'Messages'],
    ['organizer', 'Tax Organizer'],
    ['documents', 'My Documents'],
    ['drafts', 'Tax Drafts'],
    ['invoices', 'Invoices'],
    ['final', 'Final Documents'],
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof caseTabs)[number][0]>('messages');
  const draftUploadFormRef = useRef<HTMLFormElement | null>(null);
  const draftUploadInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceUploadFormRef = useRef<HTMLFormElement | null>(null);
  const invoiceUploadInputRef = useRef<HTMLInputElement | null>(null);
  const finalUploadFormRef = useRef<HTMLFormElement | null>(null);
  const finalUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [draftUploading, setDraftUploading] = useState(false);
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const [finalUploading, setFinalUploading] = useState(false);
  const ticket = useMemo(() => hydrateTicket(ticketRaw), [ticketRaw]);
  const ref = displayTicketRef(ticket);
  const status = clientStatusPresentation(ticket);
  const messages = useTicketMessagesRealtime(ticket.id, ticket.messages ?? [], { hideInternal: false });
  const viewerIsStaff = viewerRole === 'admin' || viewerRole === 'employee';
  const activeTabLabel =
    caseTabs.find(([id]) => id === activeTab)?.[1] ?? 'Messages';
  const currentPageLabel = activeTabLabel;
  const reads = useTicketReadReceipts(ticket.id, messages, viewerUserId);
  const { onlineOthers, typingHint, clientCurrentTab, clientOnline, notifyTyping } = useTicketPresenceTyping(
    ticket.id,
    viewerUserId,
    viewerName,
    viewerRole,
    currentPageLabel,
    ticket.clientId,
  );
  const seenLabel = readReceiptLabel(messages, viewerUserId, viewerIsStaff, reads);
  const primaryTrigger = ticketCasePrimaryTabTriggerClassName();
  const openLinkOrNotify = (url: string | undefined, emptyMessage: string) => {
    if (!url) {
      toast({ title: emptyMessage });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  useEffect(() => {
    if (draftUploading) setDraftUploading(false);
  }, [ticket.drafts?.length, draftUploading]);
  useEffect(() => {
    if (invoiceUploading) setInvoiceUploading(false);
  }, [ticket.invoiceFiles?.length, invoiceUploading]);
  useEffect(() => {
    if (finalUploading) setFinalUploading(false);
  }, [ticket.finalDocuments?.length, finalUploading]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <TicketDetailDataRefresh ticketId={ticket.id} />
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {ticketHeaderTitle(ref, ticket)}
          </h1>
          <p className="text-xs text-muted-foreground">
            {ticket.clientName}
            {ticket.clientEmail ? ` · ${ticket.clientEmail}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <p className="text-[11px] font-medium leading-tight text-muted-foreground">
            {clientOnline && clientCurrentTab ? `Client current page: ${clientCurrentTab}` : 'Client is offline'}
          </p>
          <div>
            <span
              className={cn(
                'inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold',
                status.className,
              )}
            >
              {status.label}
            </span>
          </div>
          <span className="text-[11px] leading-tight text-muted-foreground tabular-nums">
            {formatTicketLastUpdatedLine(ticket.updatedAt)}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof caseTabs)[number][0])} className="gap-0">
        <TabsList className={ticketCasePrimaryTabsListClassName}>
          {caseTabs.map(([id, label]) => (
            <TabsTrigger key={id} value={id} className={primaryTrigger}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="messages" className="mt-0 border-0 p-0">
          <div className="flex min-h-[360px] flex-col border-t border-border bg-background">
            <ScrollArea className="flex-1 p-4">
              <div className="mb-2 space-y-1 rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                {onlineOthers.length > 0 ? (
                  <p>
                    <span className="font-medium text-foreground/80">Online</span> ·{' '}
                    {onlineOthers.map((o) => o.name).join(', ')}
                  </p>
                ) : null}
                {typingHint ? <p className="text-foreground">{typingHint}</p> : null}
                {seenLabel ? <p>{seenLabel}</p> : null}
              </div>
              <div className="min-h-[240px] space-y-3 pr-2 text-foreground">
                {messages.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No messages yet. Client and team messages will appear here.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-sm',
                        msg.isInternal
                          ? 'border-border bg-muted/50 dark:bg-muted/30'
                          : msg.senderId === ticket.clientId
                            ? 'ml-4 border-primary/30 bg-primary/5 sm:ml-8'
                            : 'mr-4 border-border bg-muted/40 sm:mr-8',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{msg.senderName}</span>
                        <div className="flex items-center gap-2">
                          {msg.isInternal && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                              Internal
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {msg.senderRole}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {msg.createdAt.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-foreground">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <form action={sendStaffMessageFormAction} className="space-y-2">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <Textarea
                  name="body"
                  placeholder="Add a client message or internal note…"
                  className="min-h-[88px] resize-none bg-background"
                  required
                  onInput={() => notifyTyping()}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="internal" className="rounded border-input" />
                    Internal note
                  </label>
                  <Button type="submit" variant="default" className={ticketCaseBlackCtaButtonClassName}>
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizer" className="mt-0 border-0 p-0">
          <TaxOrganizerPanel key={ticket.id} ticketId={ticket.id} initialAnswers={organizerAnswers} />
        </TabsContent>

        <TabsContent value="documents" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Documents</div>
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
                        No documents for this ticket yet.
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
            <p className="text-sm text-muted-foreground">
              Same document list as the client portal; uploads are managed from the client account.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Tax Return Drafts</div>
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
                        {d.url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={d.url} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => openLinkOrNotify(d.url, 'Draft not available yet.')}
                          >
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <form
              ref={draftUploadFormRef}
              action={staffUploadDraftFormAction}
              encType="multipart/form-data"
              className="space-y-2"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input
                ref={draftUploadInputRef}
                type="file"
                name="file"
                required
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (!selected || !draftUploadFormRef.current) return;
                  setDraftUploading(true);
                  draftUploadFormRef.current.requestSubmit();
                }}
              />
              <Button
                type="button"
                variant="default"
                className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
                onClick={() => draftUploadInputRef.current?.click()}
                disabled={draftUploading}
              >
                <Upload className="size-4" />
                {draftUploading ? 'Uploading draft...' : 'Choose Draft File'}
              </Button>
            </form>
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
                              ? 'border border-primary/30 bg-primary/10 text-primary'
                              : 'border border-border bg-muted text-muted-foreground',
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
                      <div className="ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() =>
                            toast({
                              title: `Invoice ${inv.invoiceNumber}`,
                              description: inv.description || 'Invoice details are shown in this card.',
                            })
                          }
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Uploaded Invoice Files</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                    <TableHead className="w-[120px] text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!ticket.invoiceFiles || ticket.invoiceFiles.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No invoice files uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {ticket.invoiceFiles?.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {f.sharedAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {f.url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={f.url} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" type="button" onClick={() => openLinkOrNotify(f.url, 'Invoice file not available yet.')}>
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <form
              ref={invoiceUploadFormRef}
              action={staffUploadInvoiceFileFormAction}
              encType="multipart/form-data"
              className="space-y-2"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input
                ref={invoiceUploadInputRef}
                type="file"
                name="file"
                required
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (!selected || !invoiceUploadFormRef.current) return;
                  setInvoiceUploading(true);
                  invoiceUploadFormRef.current.requestSubmit();
                }}
              />
              <Button
                type="button"
                variant="default"
                className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
                onClick={() => invoiceUploadInputRef.current?.click()}
                disabled={invoiceUploading}
              >
                <Upload className="size-4" />
                {invoiceUploading ? 'Uploading invoice...' : 'Choose Invoice File'}
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="final" className="mt-0 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Final filing package</div>
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
                        Final documents will appear here once the return is completed.
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
                        {f.url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={f.url} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => openLinkOrNotify(f.url, 'Final document not available yet.')}
                          >
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <form
              ref={finalUploadFormRef}
              action={staffUploadFinalPackageFormAction}
              encType="multipart/form-data"
              className="space-y-2"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input
                ref={finalUploadInputRef}
                type="file"
                name="file"
                required
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (!selected || !finalUploadFormRef.current) return;
                  setFinalUploading(true);
                  finalUploadFormRef.current.requestSubmit();
                }}
              />
              <Button
                type="button"
                variant="default"
                className={cn('gap-2', ticketCaseBlackCtaButtonClassName)}
                onClick={() => finalUploadInputRef.current?.click()}
                disabled={finalUploading}
              >
                <Upload className="size-4" />
                {finalUploading ? 'Uploading final package...' : 'Choose Final Package File'}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
