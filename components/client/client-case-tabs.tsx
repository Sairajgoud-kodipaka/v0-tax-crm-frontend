'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTicketStageRealtime } from '@/hooks/use-ticket-stage-realtime';
import { useTicketMessagesRealtime } from '@/hooks/use-ticket-messages-realtime';
import { TicketDetailDataRefresh } from '@/components/realtime/ticket-detail-data-refresh';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { displayTicketRef, formatTicketLastUpdatedLine } from '@/lib/client-ui';
import { hydrateTicket } from '@/lib/data/hydrate-ticket';
import {
  sendClientMessageFormAction,
  payInvoiceFormAction,
  clientUploadDocumentFormAction,
  clientDeleteDocumentFormAction,
} from '@/app/actions/forms';
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
import { Trash2, Upload } from 'lucide-react';
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

/** Pass JSON-serializable ticket from a Server Component (dates as ISO strings). */
export function ClientCaseTabs({
  ticketRaw,
  organizerAnswers = {},
  viewerUserId,
  viewerName,
  viewerRole = 'client',
}: {
  ticketRaw: Record<string, unknown>;
  organizerAnswers?: Record<string, unknown>;
  viewerUserId: string;
  viewerName: string;
  viewerRole?: UserRole;
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
  const activeTabLabel =
    caseTabs.find(([id]) => id === activeTab)?.[1] ?? 'Messages';
  const pathname = usePathname();
  const currentPageLabel = `${pathname} / ${activeTabLabel}`;
  const ticket = useMemo(() => hydrateTicket(ticketRaw), [ticketRaw]);
  const { lastUpdatedAt } = useTicketStageRealtime(
    ticket.id,
    ticket.stage,
    ticket.updatedAt,
  );
  const ref = displayTicketRef(ticket);
  const messagesLive = useTicketMessagesRealtime(ticket.id, ticket.messages ?? [], {
    hideInternal: true,
  });
  const messages = useMemo(
    () => messagesLive.filter((m) => !m.isInternal),
    [messagesLive],
  );
  const viewerIsStaff = viewerRole === 'admin' || viewerRole === 'employee';
  const reads = useTicketReadReceipts(ticket.id, messages, viewerUserId);
  const { onlineOthers, typingHint, notifyTyping } = useTicketPresenceTyping(
    ticket.id,
    viewerUserId,
    viewerName,
    viewerRole,
    currentPageLabel,
  );
  const seenLabel = readReceiptLabel(messages, viewerUserId, viewerIsStaff, reads);
  const primaryTrigger = ticketCasePrimaryTabTriggerClassName();
  const uploadFormRef = useRef<HTMLFormElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedUploadPreviewUrl, setSelectedUploadPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const openLinkOrNotify = (url: string | undefined, emptyMessage: string) => {
    if (!url) {
      toast({ title: emptyMessage });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  useEffect(() => {
    if (!selectedUploadFile) {
      setSelectedUploadPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedUploadFile);
    setSelectedUploadPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedUploadFile]);
  useEffect(() => {
    if (!uploading) return;
    setUploading(false);
  }, [ticket.documents.length, uploading]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <TicketDetailDataRefresh ticketId={ticket.id} />
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {ticketHeaderTitle(ref, ticket)}
        </h1>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center">
            <span className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
              Viewing: {currentPageLabel}
            </span>
          </div>
          <span className="text-[11px] leading-tight text-muted-foreground tabular-nums">
            {formatTicketLastUpdatedLine(lastUpdatedAt)}
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
              <form action={sendClientMessageFormAction} className="space-y-3">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <Textarea
                  name="body"
                  placeholder="Type your message…"
                  className="min-h-[88px] resize-none bg-background"
                  required
                  onInput={() => notifyTyping()}
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="default" className={ticketCaseBlackCtaButtonClassName}>
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizer" className="mt-0 border-0 p-0">
          <TaxOrganizerPanel
            key={ticket.id}
            ticketId={ticket.id}
            initialAnswers={organizerAnswers}
          />
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
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={doc.url} target="_blank" rel="noreferrer">
                                View
                              </Link>
                            </Button>
                            <form action={clientDeleteDocumentFormAction}>
                              <input type="hidden" name="documentId" value={doc.id} />
                              <Button type="submit" variant="ghost" size="icon" aria-label="Delete document">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <form
              ref={uploadFormRef}
              action={clientUploadDocumentFormAction}
              encType="multipart/form-data"
              className="space-y-3"
            >
              <input type="hidden" name="ticketId" value={ticket.id} />
              <input
                ref={uploadInputRef}
                type="file"
                name="file"
                required
                className="hidden"
                onChange={(e) => {
                  const nextFile = e.target.files?.[0] ?? null;
                  setSelectedUploadFile(nextFile);
                  if (nextFile && uploadFormRef.current) {
                    setUploading(true);
                    uploadFormRef.current.requestSubmit();
                  }
                }}
              />
              {selectedUploadFile ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">{selectedUploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedUploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {selectedUploadPreviewUrl && selectedUploadFile.type.startsWith('image/') ? (
                    <img
                      src={selectedUploadPreviewUrl}
                      alt="Selected document preview"
                      className="mt-3 max-h-56 w-auto rounded-md border border-border object-contain"
                    />
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Preview is available after upload for this file type.
                    </p>
                  )}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {selectedUploadFile ? 'Choose another file' : 'Choose file'}
                </Button>
                {uploading ? <span className="text-xs text-muted-foreground">Uploading...</span> : null}
              </div>
            </form>
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
                      <div className="ml-auto flex gap-2">
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
                        {inv.status === 'unpaid' && (
                          <form action={payInvoiceFormAction}>
                            <input type="hidden" name="invoiceId" value={inv.id} />
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <Button size="sm" type="submit" variant="default" className={ticketCaseBlackCtaButtonClassName}>
                              Pay
                            </Button>
                          </form>
                        )}
                        {inv.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              toast({
                                title: `Receipt · ${inv.invoiceNumber}`,
                                description: inv.paidAt
                                  ? `Paid on ${inv.paidAt.toLocaleDateString()}`
                                  : 'Receipt details are being prepared.',
                              })
                            }
                          >
                            View receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Invoice Files</div>
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
                        No invoice files shared yet.
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
            <p className="text-sm text-muted-foreground">
              Official completed documents for this ticket once filing is finalized.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
