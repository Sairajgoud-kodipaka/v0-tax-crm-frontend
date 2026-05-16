'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useTicketStageRealtime } from '@/hooks/use-ticket-stage-realtime';
import { useTicketMessagesRealtime } from '@/hooks/use-ticket-messages-realtime';
import { TicketDetailDataRefresh } from '@/components/realtime/ticket-detail-data-refresh';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  displayTicketRef,
  formatTicketLastUpdatedLine,
  parseVisibleClientCaseTabId,
  parseClientCaseTabId,
  isMessagesTabDeepLink,
  CLIENT_CASE_TAB_LABELS,
  CLIENT_VISIBLE_CASE_TAB_IDS,
  type ClientVisibleCaseTabId,
} from '@/lib/client-ui';
import { TICKET_STAGES } from '@/lib/constants';
import { hydrateTicket } from '@/lib/data/hydrate-ticket';
import {
  payInvoiceFormAction,
  clientUploadDocumentFormAction,
  clientDraftResponseFormAction,
} from '@/app/actions/forms';
import { ReplaceDocumentButton } from '@/components/documents/replace-document-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessageThread } from '@/components/messages/chat-message-thread';
import { ClientChatBubble } from '@/components/messages/client-chat-bubble';
import { ClientMessageComposer } from '@/components/messages/client-message-composer';
import { ClientMessagesDialog } from '@/components/messages/client-messages-dialog';
import { InternalNotesLauncherButton } from '@/components/messages/internal-notes-launcher-button';
import { MessagesLauncherButton } from '@/components/messages/messages-launcher-button';
import { StaffTicketMessaging } from '@/components/messages/staff-ticket-messaging';
import type { StaffMessagesTab } from '@/components/messages/staff-tabbed-messages-dialog';
import { TicketConversationPanel } from '@/components/messages/ticket-conversation-panel';
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
import {
  ticketCaseBlackCtaButtonClassName,
  ticketCasePrimaryTabTriggerClassName,
  ticketCasePrimaryTabsListClassName,
} from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';
import { hasReadMessage, useTicketReadReceipts, readReceiptLabel } from '@/hooks/use-ticket-read-receipts';
import { useTicketPresenceTyping } from '@/hooks/use-ticket-presence-typing';
import { useTicketHistoryRealtime } from '@/hooks/use-ticket-history-realtime';
import { TicketHistory } from '@/components/tickets/ticket-history';
import type { TicketActivity, TicketStage, UserRole } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { submitClientInformationAction } from '@/app/actions/tickets';

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

function clientStageStatusBannerText(stage: TicketStage): string {
  switch (stage) {
    case 'pending-info':
      return 'Please complete your tax organizer and upload your documents to get started.';
    case 'under-prep':
      return 'Your preparer is working on your return. We will notify you when the draft is ready.';
    case 'draft-sent':
      return 'Your draft return is ready. Please review and approve.';
    case 'awaiting-approval':
      return 'Waiting for your approval on the draft.';
    case 'payment-received':
      return 'Payment received. We will send your signing form shortly.';
    case '8879-sent':
      return 'Please sign and return Form 8879 to authorize filing.';
    case '8879-received':
      return 'Signed form received. Your return is being filed.';
    case 'filing-completed':
      return 'Your return has been filed. Download your copy under Final Documents.';
    case 'closed':
      return 'This case is closed. All documents are available below.';
    default:
      return '';
  }
}

/** Pass JSON-serializable ticket from a Server Component (dates as ISO strings). */
export function ClientCaseTabs({
  ticketRaw,
  ticketActivities = [],
  organizerAnswers = {},
  viewerUserId,
  viewerName,
  viewerRole = 'client',
  initialTabFromUrl = null,
}: {
  ticketRaw: Record<string, unknown>;
  ticketActivities?: Record<string, unknown>[];
  organizerAnswers?: Record<string, unknown>;
  viewerUserId: string;
  viewerName: string;
  viewerRole?: UserRole;
  /** From `/client/cases/[id]?tab=` — deep link & “resume” entry points. */
  initialTabFromUrl?: string | null;
}) {
  const caseTabs = CLIENT_VISIBLE_CASE_TAB_IDS.map(
    (id) => [id, CLIENT_CASE_TAB_LABELS[id]] as const,
  );
  const pathname = usePathname();
  const router = useRouter();
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(() =>
    isMessagesTabDeepLink(initialTabFromUrl),
  );
  const [messagesTab, setMessagesTab] = useState<StaffMessagesTab>('client');
  const [activeTab, setActiveTab] = useState<ClientVisibleCaseTabId>(
    () => parseVisibleClientCaseTabId(initialTabFromUrl) ?? 'organizer',
  );
  const [resumePrompt, setResumePrompt] = useState<{ tab: ClientVisibleCaseTabId; label: string } | null>(
    null,
  );
  const activeTabLabel = CLIENT_CASE_TAB_LABELS[activeTab];
  const currentPageLabel = messagesDialogOpen ? CLIENT_CASE_TAB_LABELS.messages : activeTabLabel;
  const ticket = useMemo(() => hydrateTicket(ticketRaw), [ticketRaw]);
  const tabStorageKey = useMemo(() => `taxcrm:clientCaseLastTab:${ticket.id}`, [ticket.id]);
  const { lastUpdatedAt } = useTicketStageRealtime(
    ticket.id,
    ticket.stage,
    ticket.updatedAt,
  );
  const ref = displayTicketRef(ticket);
  const viewerIsStaff = viewerRole === 'admin' || viewerRole === 'employee';
  const messagesLive = useTicketMessagesRealtime(ticket.id, ticket.messages ?? [], {
    hideInternal: !viewerIsStaff,
  });
  const messages = useMemo(
    () => (viewerIsStaff ? messagesLive : messagesLive.filter((m) => !m.isInternal)),
    [messagesLive, viewerIsStaff],
  );
  const internalMessages = useMemo(
    () => messages.filter((m) => m.isInternal),
    [messages],
  );
  const clientFacingMessages = useMemo(
    () => messages.filter((m) => !m.isInternal),
    [messages],
  );
  const activitiesInitial = useMemo(() => {
    return (ticketActivities ?? []).map((activity) => ({
      ...activity,
      createdAt: new Date(activity.createdAt as string),
    })) as TicketActivity[];
  }, [ticketActivities]);
  const historyActivities = useTicketHistoryRealtime(ticket.id, activitiesInitial);
  const reads = useTicketReadReceipts(ticket.id, clientFacingMessages, viewerUserId);
  const messagesById = useMemo(() => new Map(clientFacingMessages.map((m) => [m.id, m])), [clientFacingMessages]);
  const { onlineOthers, typingHint, notifyTyping } = useTicketPresenceTyping(
    ticket.id,
    viewerUserId,
    viewerName,
    viewerRole,
    currentPageLabel,
  );
  const seenLabel = readReceiptLabel(clientFacingMessages, viewerUserId, viewerIsStaff, reads);
  const unreadMessageCount = useMemo(
    () =>
      clientFacingMessages.filter(
        (m) => m.senderId !== viewerUserId && !hasReadMessage(m, reads[viewerUserId], messagesById),
      ).length,
    [clientFacingMessages, messagesById, reads, viewerUserId],
  );
  const primaryTrigger = ticketCasePrimaryTabTriggerClassName();
  const uploadFormRef = useRef<HTMLFormElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedUploadPreviewUrl, setSelectedUploadPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submittingInfo, startSubmitInfo] = useTransition();
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

  const openMessagesDialog = useCallback(() => {
    setMessagesTab('client');
    setMessagesDialogOpen(true);
    setResumePrompt(null);
  }, []);

  const openInternalNotesDialog = useCallback(() => {
    setMessagesTab('internal');
    setMessagesDialogOpen(true);
    setResumePrompt(null);
  }, []);

  const handleCaseTabChange = useCallback(
    (value: string) => {
      if (isMessagesTabDeepLink(value)) {
        openMessagesDialog();
        return;
      }
      const v = parseVisibleClientCaseTabId(value);
      if (!v) return;
      setActiveTab(v);
      setResumePrompt((prev) => (prev?.tab === v ? null : prev));
      try {
        localStorage.setItem(tabStorageKey, v);
      } catch {
        /* ignore */
      }
      const qs = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      qs.set('tab', v);
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    },
    [openMessagesDialog, pathname, router, tabStorageKey],
  );

  useEffect(() => {
    if (isMessagesTabDeepLink(initialTabFromUrl)) {
      setMessagesDialogOpen(true);
      const fallback = parseVisibleClientCaseTabId(initialTabFromUrl) ?? 'organizer';
      setActiveTab(fallback);
      const qs = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      qs.delete('tab');
      const next = qs.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      return;
    }
    const fromServer = parseVisibleClientCaseTabId(initialTabFromUrl);
    if (fromServer) {
      setActiveTab(fromServer);
      try {
        localStorage.setItem(tabStorageKey, fromServer);
      } catch {
        /* ignore */
      }
      setResumePrompt(null);
      return;
    }
    try {
      const lsTab = parseVisibleClientCaseTabId(localStorage.getItem(tabStorageKey));
      if (lsTab) {
        setResumePrompt({ tab: lsTab, label: CLIENT_CASE_TAB_LABELS[lsTab] });
      } else {
        setResumePrompt(null);
      }
    } catch {
      setResumePrompt(null);
    }
  }, [ticket.id, initialTabFromUrl, tabStorageKey, pathname, router]);

  useEffect(() => {
    const onPop = () => {
      const raw = new URL(window.location.href).searchParams.get('tab');
      if (isMessagesTabDeepLink(raw)) {
        setMessagesDialogOpen(true);
        return;
      }
      const t = parseVisibleClientCaseTabId(raw);
      if (t) {
        setActiveTab(t);
        setMessagesDialogOpen(false);
        try {
          localStorage.setItem(tabStorageKey, t);
        } catch {
          /* ignore */
        }
        setResumePrompt(null);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [tabStorageKey]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
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

      {viewerRole === 'client' ? (
        <div className="space-y-2 border-b border-border bg-muted/35 px-4 py-3 sm:px-6">
          <p className="text-sm leading-relaxed text-foreground">
            <span className="font-medium text-foreground">Case stage:</span>{' '}
            {TICKET_STAGES[ticket.stage]?.label ?? ticket.stage}
            {TICKET_STAGES[ticket.stage]?.description ? (
              <span className="text-muted-foreground"> — {TICKET_STAGES[ticket.stage]?.description}</span>
            ) : null}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{clientStageStatusBannerText(ticket.stage)}</p>
          {resumePrompt ? (
            <p className="text-sm leading-relaxed text-foreground">
              You paused on <span className="font-medium">{resumePrompt.label}</span>.{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => handleCaseTabChange(resumePrompt.tab)}
              >
                Click here to resume
              </button>{' '}
              where you left off.
            </p>
          ) : null}
        </div>
      ) : null}

      {viewerIsStaff ? (
        <StaffTicketMessaging
          ticket={ticket}
          viewerUserId={viewerUserId}
          viewerName={viewerName}
          viewerRole={viewerRole === 'admin' ? 'admin' : 'employee'}
          messagesOpen={messagesDialogOpen}
          onMessagesOpenChange={setMessagesDialogOpen}
          messagesTab={messagesTab}
          onMessagesTabChange={setMessagesTab}
          allMessages={messages}
          historyActivities={historyActivities}
          reads={reads}
          onlineOthers={onlineOthers}
          typingHint={typingHint}
          notifyTyping={notifyTyping}
        />
      ) : (
        <ClientMessagesDialog
          open={messagesDialogOpen}
          onOpenChange={setMessagesDialogOpen}
          ticketRef={ref}
        >
          {messagesDialogOpen ? (
            <TicketConversationPanel
              className="border-t-0"
              status={
                <>
                  {onlineOthers.length > 0 ? (
                    <span>
                      <span className="font-medium text-foreground/85">Online</span> ·{' '}
                      {onlineOthers.map((o) => o.name).join(', ')}
                    </span>
                  ) : null}
                  {typingHint ? <span className="text-foreground">{typingHint}</span> : null}
                  {seenLabel ? <span>{seenLabel}</span> : null}
                </>
              }
              composer={<ClientMessageComposer ticketId={ticket.id} onTyping={notifyTyping} />}
            >
              <ChatMessageThread
                messages={clientFacingMessages}
                emptyState={
                  <p className="py-10 text-center text-[13px] text-muted-foreground">
                    No messages yet. Say hello to your tax team.
                  </p>
                }
                renderMessage={(msg) => {
                  const isUnreadInbound =
                    msg.senderId !== viewerUserId && !hasReadMessage(msg, reads[viewerUserId], messagesById);
                  const isOutbound = msg.senderId === viewerUserId;
                  const seenByOther =
                    isOutbound &&
                    Object.keys(reads)
                      .filter((uid) => uid !== viewerUserId)
                      .some((uid) => hasReadMessage(msg, reads[uid], messagesById));
                  return (
                    <ClientChatBubble
                      msg={msg}
                      isOutbound={isOutbound}
                      isUnread={isUnreadInbound}
                      seenByOther={seenByOther}
                    />
                  );
                }}
              />
            </TicketConversationPanel>
          ) : null}
        </ClientMessagesDialog>
      )}

      <Tabs value={activeTab} onValueChange={handleCaseTabChange} className="w-full gap-0">
        <div className="flex items-stretch border-b border-border">
          <div className="flex shrink-0 items-center gap-1.5 border-r border-border bg-muted/25 px-2 sm:px-3">
            <MessagesLauncherButton
              unreadCount={unreadMessageCount}
              onClick={openMessagesDialog}
            />
            {viewerIsStaff ? (
              <InternalNotesLauncherButton
                count={internalMessages.length}
                onClick={openInternalNotesDialog}
              />
            ) : null}
          </div>
          <TabsList className={cn(ticketCasePrimaryTabsListClassName, 'min-w-0 flex-1 border-b-0')}>
            {caseTabs.map(([id, label]) => (
              <TabsTrigger key={id} value={id} className={primaryTrigger}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="organizer" className="mt-0 flex-none border-0 p-0">
          {activeTab === 'organizer' ? (
            <TaxOrganizerPanel
              key={ticket.id}
              ticketId={ticket.id}
              initialAnswers={organizerAnswers}
              onNavigatePastLastSection={() => setActiveTab('documents')}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="documents" className="mt-0 flex-none p-4 sm:p-6">
          {activeTab === 'documents' ? (
          <div className="space-y-4">
            {viewerRole === 'client' ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
                <p className="text-sm font-medium text-foreground">What to upload</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload whatever applies to you — use clear file names when possible.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Income documents
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
                      <li>W-2 (one per employer)</li>
                      <li>1099-NEC (freelance / contract)</li>
                      <li>1099-INT (bank interest)</li>
                      <li>1099-DIV (dividends)</li>
                      <li>1099-B (stocks / crypto sold)</li>
                      <li>1099-R (retirement withdrawals)</li>
                      <li>SSA-1099 (Social Security)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Deduction documents
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
                      <li>Mortgage interest (Form 1098)</li>
                      <li>Property tax receipts</li>
                      <li>Charitable donation receipts</li>
                      <li>Childcare receipts + provider EIN or SSN</li>
                      <li>Student loan interest (1098-E)</li>
                      <li>Medical expense receipts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Often required
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
                      <li>Last year&apos;s tax return (if available)</li>
                      <li>Photo ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">
                My Uploaded Documents
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                    <TableHead className="min-w-[180px] text-right"> </TableHead>
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
                          <div className="flex flex-wrap justify-end gap-2">
                            {doc.uploadedById === viewerUserId ? (
                              <>
                                <ReplaceDocumentButton documentId={doc.id} />
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={doc.url} target="_blank" rel="noreferrer">
                                    Download
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={doc.url} target="_blank" rel="noreferrer">
                                  View
                                </Link>
                              </Button>
                            )}
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

            {viewerRole === 'client' && ticket.stage === 'pending-info' ? (
              <div className="rounded-lg border border-border p-4 sm:p-5">
                {ticket.clientInfoSubmittedAt ? (
                  <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-foreground">
                    <p className="font-medium">Your information has been submitted.</p>
                    <p className="mt-1 text-muted-foreground">
                      Your preparer will review it and be in touch. Submitted on{' '}
                      {ticket.clientInfoSubmittedAt.toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                      .
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      When your organizer is complete and you have uploaded your documents, submit here so your
                      preparer knows you are ready for review.
                    </p>
                    <Button
                      type="button"
                      className={ticketCaseBlackCtaButtonClassName}
                      disabled={submittingInfo || ticket.documents.length === 0}
                      onClick={() => {
                        startSubmitInfo(async () => {
                          try {
                            await submitClientInformationAction(ticket.id);
                            toast({
                              title: 'Information submitted',
                              description: 'Your preparer will review it and be in touch.',
                            });
                            router.refresh();
                          } catch (err) {
                            toast({
                              variant: 'destructive',
                              title: 'Could not submit',
                              description: err instanceof Error ? err.message : 'Please try again.',
                            });
                          }
                        });
                      }}
                    >
                      {submittingInfo ? 'Submitting…' : 'Submit My Information'}
                    </Button>
                    {ticket.documents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Upload at least one document to enable submit.</p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          ) : null}
        </TabsContent>

        <TabsContent value="drafts" className="mt-0 flex-none p-4 sm:p-6">
          {activeTab === 'drafts' ? (
          <div className="space-y-4">
            {ticket.stage === 'draft-sent' && (ticket.drafts?.length ?? 0) > 0 ? (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Review your draft return</p>
                <p className="text-sm text-muted-foreground">
                  Approve to continue, or request changes and describe what you would like revised. Your
                  preparer will be notified in Messages.
                </p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <form action={clientDraftResponseFormAction} className="min-w-0 flex-1 space-y-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <input type="hidden" name="action" value="approve" />
                    <Textarea
                      name="body"
                      placeholder="Optional note to your preparer"
                      className="min-h-[72px] resize-none bg-background"
                    />
                    <Button type="submit" className={ticketCaseBlackCtaButtonClassName}>
                      Approve draft
                    </Button>
                  </form>
                  <form action={clientDraftResponseFormAction} className="min-w-0 flex-1 space-y-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <input type="hidden" name="action" value="request_changes" />
                    <Textarea
                      name="body"
                      placeholder="Describe the changes you need…"
                      className="min-h-[88px] resize-none bg-background"
                      required
                    />
                    <Button type="submit" variant="outline">
                      Request changes
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}
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
          ) : null}
        </TabsContent>

        <TabsContent value="invoices" className="mt-0 flex-none p-4 sm:p-6">
          {activeTab === 'invoices' ? (
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
          ) : null}
        </TabsContent>

        <TabsContent value="final" className="mt-0 flex-none p-4 sm:p-6">
          {activeTab === 'final' ? (
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
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="mt-0 flex-none p-4 sm:p-6">
          {activeTab === 'history' ? (
            <TicketHistory
              activities={historyActivities}
              isStaff={false}
              onTabSwitch={(tab) => handleCaseTabChange(tab)}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
