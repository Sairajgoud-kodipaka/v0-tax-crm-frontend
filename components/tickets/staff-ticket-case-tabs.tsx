'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import { useTicketMessagesRealtime } from '@/hooks/use-ticket-messages-realtime';
import { TicketDetailDataRefresh } from '@/components/realtime/ticket-detail-data-refresh';
import { clientStatusPresentation, displayTicketRef, formatTicketLastUpdatedLine, clientCaseTabIdFromPresenceLabel, CLIENT_CASE_TAB_LABELS, parseClientCaseTabId, suggestedClientCaseTabForStage, type ClientCaseTabId } from '@/lib/client-ui';
import { hydrateTicket } from '@/lib/data/hydrate-ticket';
import {
  sendStaffMessageFormAction,
  staffUploadDraftFormAction,
  staffUploadInvoiceFileFormAction,
  staffUploadFinalPackageFormAction,
  deleteTicketDocumentFormAction,
} from '@/app/actions/forms';
import { requestDocumentAction } from '@/app/actions/documents';
import { ReplaceDocumentButton } from '@/components/documents/replace-document-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
// import { PDFGeneratorButton } from '@/components/organizer/pdf-generator-button';
import {
  ticketCaseBlackCtaButtonClassName,
  ticketCasePrimaryTabTriggerClassName,
  ticketCasePrimaryTabsListClassName,
} from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';
import { hasReadMessage, useTicketReadReceipts, readReceiptLabel } from '@/hooks/use-ticket-read-receipts';
import { useTicketPresenceTyping } from '@/hooks/use-ticket-presence-typing';
import type { UserRole, TicketActivity } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { MoreHorizontal, Trash2, Upload, Eye, Download } from 'lucide-react';
import { useTicketHistoryRealtime } from '@/hooks/use-ticket-history-realtime';
import { TicketHistory } from '@/components/tickets/ticket-history';
import { staffReviewDraftAction } from '@/app/actions/tickets';
import { escalateInternalThreadAction, markInternalThreadResolvedAction } from '@/app/actions/messages';
import { updateTicketStageAction } from '@/app/actions/tickets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { STAGE_NAVIGATION, TICKET_STAGES } from '@/lib/constants';

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

function relativeSeenLine(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = 60_000;
  const hr = 60 * min;
  if (diffMs < min) return 'Seen just now';
  if (diffMs < hr) return `Seen ${Math.max(1, Math.round(diffMs / min))} min ago`;
  if (diffMs < 24 * hr) return `Seen ${Math.max(1, Math.round(diffMs / hr))} hours ago`;
  if (diffMs < 48 * hr) return 'Seen yesterday';
  return `Seen ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

function draftBadgePresentation(status: 'approved' | 'rejected' | null): { label: string; className: string } | null {
  if (status === 'approved') {
    return { label: 'Approved', className: 'border border-emerald-300 bg-emerald-50 text-emerald-700' };
  }
  if (status === 'rejected') {
    return { label: 'Rejected', className: 'border border-red-300 bg-red-50 text-red-700' };
  }
  return null;
}

/** Same tabbed shell as the client case view — Messages, Tax Organizer (3-level layout), documents, drafts, invoices, final. */
export function StaffTicketCaseTabs({
  ticketRaw,
  organizerAnswers = {},
  viewerUserId,
  viewerName,
  viewerRole,
  initialTabFromUrl = null,
}: {
  ticketRaw: Record<string, unknown>;
  organizerAnswers?: Record<string, unknown>;
  viewerUserId: string;
  viewerName: string;
  viewerRole: UserRole;
  initialTabFromUrl?: string | null;
}) {
  const caseTabs = [
    ['messages', 'Messages'],
    ['organizer', 'Tax Organizer'],
    ['documents', 'My Documents'],
    ['drafts', 'Tax Drafts'],
    ['invoices', 'Invoices'],
    ['final', 'Final Documents'],
    ['history', 'History'],
  ] as const satisfies ReadonlyArray<readonly [ClientCaseTabId, string]>;
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ClientCaseTabId>(() => parseClientCaseTabId(initialTabFromUrl) ?? 'messages');
  const draftUploadFormRef = useRef<HTMLFormElement | null>(null);
  const draftUploadInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceUploadFormRef = useRef<HTMLFormElement | null>(null);
  const invoiceUploadInputRef = useRef<HTMLInputElement | null>(null);
  const finalUploadFormRef = useRef<HTMLFormElement | null>(null);
  const finalUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [draftUploading, setDraftUploading] = useState(false);
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const [finalUploading, setFinalUploading] = useState(false);
  const [requestingDocument, setRequestingDocument] = useState(false);
  const [rejectDialogOpenForDraftId, setRejectDialogOpenForDraftId] = useState<string | null>(null);
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewingDraftId, setReviewingDraftId] = useState<string | null>(null);
  const [internalBody, setInternalBody] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [pendingNoteAction, startPendingNoteAction] = useTransition();
  const [internalMode, setInternalMode] = useState(false);
  const ticket = useMemo(() => hydrateTicket(ticketRaw), [ticketRaw]);
  const ref = displayTicketRef(ticket);
  const status = clientStatusPresentation(ticket);
  const messages = useTicketMessagesRealtime(ticket.id, ticket.messages ?? [], { hideInternal: false });
  const activitiesInitial = useMemo(() => {
    return (ticket.activities ?? []).map((activity) => ({
      ...activity,
      createdAt: new Date(activity.createdAt as unknown as string),
    })) as TicketActivity[];
  }, [ticket.activities]);
  const historyActivities = useTicketHistoryRealtime(ticket.id, activitiesInitial);
  const latestSeenByUser = useMemo(() => {
    const map: Record<string, Date> = {};
    for (const m of messages) {
      map[m.senderId] = m.createdAt;
    }
    return map;
  }, [messages]);
  const draftReviewMap = useMemo(() => {
    const map: Record<string, { status: 'approved' | 'rejected'; reason?: string; actorName?: string; at: Date }> = {};
    for (const activity of historyActivities) {
      if (activity.actionType !== 'draft_approved' && activity.actionType !== 'draft_rejected') continue;
      const draftId = `${activity.actionDetails.draft_id ?? ''}`.trim();
      if (!draftId) continue;
      map[draftId] = {
        status: activity.actionType === 'draft_approved' ? 'approved' : 'rejected',
        reason: typeof activity.actionDetails.reason === 'string' ? activity.actionDetails.reason : undefined,
        actorName:
          typeof activity.actionDetails.actor_name === 'string'
            ? activity.actionDetails.actor_name
            : undefined,
        at: activity.createdAt,
      };
    }
    return map;
  }, [historyActivities]);
  const viewerIsStaff = viewerRole === 'admin' || viewerRole === 'employee';
  const activeTabLabel =
    caseTabs.find(([id]) => id === activeTab)?.[1] ?? 'Messages';
  const currentPageLabel = activeTabLabel;
  const reads = useTicketReadReceipts(ticket.id, messages, viewerUserId);
  const messagesById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const clientMessages = useMemo(() => messages.filter((m) => !m.isInternal), [messages]);
  const internalMessages = useMemo(() => messages.filter((m) => m.isInternal), [messages]);
  const preparerMentionCandidates = useMemo(() => {
    const options = new Map<string, { id: string; name: string }>();
    for (const m of internalMessages) {
      if (m.senderRole !== 'admin' && m.senderRole !== 'employee') continue;
      options.set(m.senderId, { id: m.senderId, name: m.senderName });
    }
    options.set(viewerUserId, { id: viewerUserId, name: viewerName });
    return Array.from(options.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [internalMessages, viewerName, viewerUserId]);
  const filteredMentionCandidates = useMemo(() => {
    if (!mentionQuery.trim()) return preparerMentionCandidates;
    const q = mentionQuery.trim().toLowerCase();
    return preparerMentionCandidates.filter((candidate) => candidate.name.toLowerCase().includes(q));
  }, [mentionQuery, preparerMentionCandidates]);
  const { onlineOthers, typingHint, clientCurrentTab, clientOnline, notifyTyping } = useTicketPresenceTyping(
    ticket.id,
    viewerUserId,
    viewerName,
    viewerRole,
    currentPageLabel,
    ticket.clientId,
  );
  const seenLabel = readReceiptLabel(messages, viewerUserId, viewerIsStaff, reads);
  const primaryTrigger = cn(ticketCasePrimaryTabTriggerClassName(), 'whitespace-nowrap px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm');
  const openLinkOrNotify = (url: string | undefined, emptyMessage: string) => {
    if (!url) {
      toast({ title: emptyMessage });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const nextStage = useMemo(() => {
    const idx = STAGE_NAVIGATION.findIndex((s) => s.id === ticket.stage);
    if (idx < 0 || idx >= STAGE_NAVIGATION.length - 1) return null;
    return STAGE_NAVIGATION[idx + 1];
  }, [ticket.stage]);
  useEffect(() => {
    if (draftUploading) setDraftUploading(false);
  }, [ticket.drafts?.length, draftUploading]);
  useEffect(() => {
    if (invoiceUploading) setInvoiceUploading(false);
  }, [ticket.invoiceFiles?.length, invoiceUploading]);
  useEffect(() => {
    if (finalUploading) setFinalUploading(false);
  }, [ticket.finalDocuments?.length, finalUploading]);

  const approveDraft = async (draftId: string) => {
    try {
      setReviewingDraftId(draftId);
      await staffReviewDraftAction({
        ticketId: ticket.id,
        draftId,
        decision: 'approved',
      });
      toast({ title: 'Draft approved successfully.' });
    } catch (error) {
      toast({
        title: 'Could not approve draft',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReviewingDraftId(null);
    }
  };

  const submitRejection = async () => {
    const draftId = rejectDialogOpenForDraftId;
    const trimmedReason = rejectReason.trim();
    if (!draftId) return;
    if (trimmedReason.length < 10) {
      toast({ title: 'Reason must be at least 10 characters', variant: 'destructive' });
      return;
    }
    try {
      setReviewingDraftId(draftId);
      await staffReviewDraftAction({
        ticketId: ticket.id,
        draftId,
        decision: 'rejected',
        reason: trimmedReason,
      });
      setRejectReason('');
      setRejectReasonOpen(false);
      setRejectDialogOpenForDraftId(null);
      toast({ title: 'Draft rejected successfully.' });
    } catch (error) {
      toast({
        title: 'Could not reject draft',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReviewingDraftId(null);
    }
  };

  const handleInternalBodyChange = (value: string) => {
    setInternalBody(value);
    const mentionMatch = value.match(/@([a-zA-Z\s]*)$/);
    if (!mentionMatch) {
      setMentionOpen(false);
      setMentionQuery('');
      setMentionIndex(0);
      return;
    }
    setMentionOpen(true);
    setMentionQuery(mentionMatch[1] ?? '');
    setMentionIndex(0);
  };

  const applyMention = (name: string) => {
    const next = internalBody.replace(/@([a-zA-Z\s]*)$/, `@${name} `);
    setInternalBody(next);
    setMentionOpen(false);
    setMentionQuery('');
  };

  const clientResumeTab =
    clientCaseTabIdFromPresenceLabel(clientCurrentTab) ?? suggestedClientCaseTabForStage(ticket.stage);

  const copyClientResumeLink = useCallback(async () => {
    const tab = clientCaseTabIdFromPresenceLabel(clientCurrentTab) ?? suggestedClientCaseTabForStage(ticket.stage);
    const path = `/client/cases/${ticket.id}?tab=${tab}`;
    const full = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(full);
      toast({ title: 'Link copied', description: 'Send this to the client so they can jump back into their case.' });
    } catch {
      toast({ title: 'Copy this link manually', description: full, variant: 'destructive' });
    }
  }, [clientCurrentTab, ticket.id, ticket.stage]);

  const handleStaffTabChange = useCallback(
    (value: string) => {
      const v = parseClientCaseTabId(value);
      if (!v) return;
      setActiveTab(v);
      const qs = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      qs.set('tab', v);
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const from = parseClientCaseTabId(initialTabFromUrl);
    if (from) setActiveTab(from);
  }, [initialTabFromUrl]);

  useEffect(() => {
    const onPop = () => {
      const t = parseClientCaseTabId(new URL(window.location.href).searchParams.get('tab'));
      if (t) setActiveTab(t);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <TicketDetailDataRefresh ticketId={ticket.id} />
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {ticketHeaderTitle(ref, ticket)}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {ticket.clientName}
            {ticket.clientEmail ? ` · ${ticket.clientEmail}` : ''}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-left sm:items-end sm:text-right">
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
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Case pipeline stage:</span>{' '}
            {TICKET_STAGES[ticket.stage]?.label ?? ticket.stage}
            {TICKET_STAGES[ticket.stage]?.description
              ? ` — ${TICKET_STAGES[ticket.stage]?.description}`
              : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void copyClientResumeLink()}
            >
              Copy client resume link
            </Button>
            <span className="max-w-xl text-[11px] text-muted-foreground">
              Opens their portal on <span className="font-medium text-foreground">{CLIENT_CASE_TAB_LABELS[clientResumeTab]}</span>
              {clientOnline && clientCurrentTab
                ? ' (aligned with their current page when they are online).'
                : ' (suggested from this case stage when they are offline).'}
            </span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleStaffTabChange} className="gap-0">
        <div className="overflow-x-auto border-b border-border bg-black">
        <TabsList className={cn(ticketCasePrimaryTabsListClassName, 'min-w-max flex-nowrap border-b-0')}>
          {caseTabs.map(([id, label]) => (
            <TabsTrigger key={id} value={id} className={primaryTrigger}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        </div>

        <TabsContent value="messages" className="mt-0 border-0 p-0">
          <div className="flex min-h-[360px] flex-col bg-background">
            <ScrollArea className="flex-1 p-3 sm:p-4">
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

              {/* Unified Message Stream */}
              <div className="min-h-[240px] space-y-3 pr-1 text-foreground sm:pr-2">
                {messages.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No messages yet. Client and team communication will appear here.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const latestSeen = latestSeenByUser[msg.senderId];
                    const isUnreadFromClient = msg.senderId === ticket.clientId && !hasReadMessage(msg, reads[viewerUserId], messagesById);
                    const isOutbound = msg.senderId === viewerUserId;
                    const seenByOther =
                      isOutbound &&
                      Object.keys(reads)
                        .filter((uid) => uid !== viewerUserId)
                        .some((uid) => hasReadMessage(msg, reads[uid], messagesById));
                    
                    const isResolved = msg.isInternal && historyActivities.some(
                      (activity) =>
                        activity.actionDetails?.resolved === true &&
                        `${activity.actionDetails?.resolved_message_id ?? ''}` === msg.id,
                    );

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-sm relative',
                          msg.isInternal
                            ? 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-100'
                            : msg.senderId === ticket.clientId
                              ? 'ml-2 border-primary/30 bg-primary/5 sm:ml-8'
                              : 'mr-2 border-border bg-muted/40 sm:mr-8',
                        )}
                      >
                        {/* Message Type Indicator */}
                        {msg.isInternal && (
                          <div className="absolute -top-2 left-3">
                            <Badge className="bg-orange-600 text-white text-[10px] px-2 py-0.5">
                              🔒 INTERNAL
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className={cn("font-medium", msg.isInternal ? "text-orange-900 dark:text-orange-100" : "text-foreground")}>
                              {msg.senderName}
                            </span>
                            {latestSeen ? (
                              <p className={cn("text-[11px]", msg.isInternal ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground")}>
                                {relativeSeenLine(latestSeen)}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            {isUnreadFromClient ? <span className="size-2 rounded-full bg-blue-500" aria-label="Unread message" /> : null}
                            <Badge variant="outline" className={cn("text-xs capitalize", msg.isInternal ? "border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300" : "")}>
                              {msg.senderRole}
                            </Badge>
                            {isResolved ? (
                              <Badge className="border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">Resolved</Badge>
                            ) : null}
                            <span className={cn("text-xs", msg.isInternal ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground")}>
                              {msg.createdAt.toLocaleString()} {isOutbound ? (seenByOther ? '✓✓' : '✓') : ''}
                            </span>
                            {msg.isInternal && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      startPendingNoteAction(async () => {
                                        await escalateInternalThreadAction(ticket.id, msg.id);
                                        toast({ title: 'Issue escalated and supervisor notified.' });
                                      })
                                    }
                                    disabled={pendingNoteAction}
                                  >
                                    Escalate Issue
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      startPendingNoteAction(async () => {
                                        if (!nextStage) {
                                          toast({ title: 'Ticket is already at final stage.' });
                                          return;
                                        }
                                        if (!window.confirm(`Move ticket to ${nextStage.label}?`)) {
                                          return;
                                        }
                                        await updateTicketStageAction(ticket.id, nextStage.id as typeof ticket.stage, 'Moved from Preparer Notes');
                                        toast({ title: `Moved to ${nextStage.label}` });
                                      })
                                    }
                                    disabled={pendingNoteAction}
                                  >
                                    Move to Next Stage
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      startPendingNoteAction(async () => {
                                        await markInternalThreadResolvedAction(ticket.id, msg.id);
                                        toast({ title: 'Marked as resolved.' });
                                      })
                                    }
                                    disabled={pendingNoteAction || isResolved}
                                  >
                                    Mark as Resolved
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <p className={cn("mt-2 whitespace-pre-wrap", msg.isInternal ? "text-orange-900 dark:text-orange-100" : "text-foreground")}>
                          {msg.isInternal ? (
                            msg.content.split(/(@[a-zA-Z]+(?:\s+[a-zA-Z]+)?)/g).map((part, idx) =>
                              part.startsWith('@') ? (
                                <span key={`${msg.id}-mention-${idx}`} className="font-bold text-orange-600 dark:text-orange-400 bg-orange-200 dark:bg-orange-800 px-1 rounded">
                                  {part}
                                </span>
                              ) : (
                                <span key={`${msg.id}-text-${idx}`}>{part}</span>
                              ),
                            )
                          ) : (
                            msg.content
                          )}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Simplified Input with Toggle */}
            <div className="border-t border-border p-3 sm:p-4">
              <form
                action={async (formData: FormData) => {
                  await sendStaffMessageFormAction(formData);
                  setInternalBody('');
                  setMentionOpen(false);
                  setMentionQuery('');
                }}
                className="space-y-3"
              >
                <input type="hidden" name="ticketId" value={ticket.id} />
                {internalMode && <input type="hidden" name="internal" value="on" />}
                
                {/* Message Type Toggle */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-foreground">Send to:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setInternalMode(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
                        !internalMode 
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300" 
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <span className="size-2 rounded-full bg-green-500"></span>
                      Client (Visible)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternalMode(true)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
                        internalMode 
                          ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300" 
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <span className="size-2 rounded-full bg-orange-500"></span>
                      Internal Team
                    </button>
                  </div>
                </div>

                {/* Unified Input */}
                <div className="relative">
                  <Textarea
                    name="body"
                    value={internalMode ? internalBody : undefined}
                    placeholder={internalMode ? "@mention teammate and add internal note..." : "Add a message for the client..."}
                    className={cn(
                      "min-h-[88px] resize-none",
                      internalMode 
                        ? "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-100" 
                        : "bg-background"
                    )}
                    required
                    onInput={() => notifyTyping()}
                    onChange={internalMode ? (e) => handleInternalBodyChange(e.currentTarget.value) : undefined}
                    onKeyDown={internalMode ? (e) => {
                      if (!mentionOpen || filteredMentionCandidates.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setMentionIndex((prev) => (prev + 1) % filteredMentionCandidates.length);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setMentionIndex((prev) => (prev - 1 + filteredMentionCandidates.length) % filteredMentionCandidates.length);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const candidate = filteredMentionCandidates[mentionIndex];
                        if (candidate) applyMention(candidate.name);
                      } else if (e.key === 'Escape') {
                        setMentionOpen(false);
                      }
                    } : undefined}
                  />
                  {internalMode && mentionOpen && filteredMentionCandidates.length > 0 ? (
                    <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
                      {filteredMentionCandidates.slice(0, 6).map((candidate, index) => (
                        <button
                          key={candidate.id}
                          type="button"
                          className={cn(
                            'w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                            index === mentionIndex && 'bg-accent',
                          )}
                          onClick={() => applyMention(candidate.name)}
                        >
                          {candidate.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className={cn(
                      internalMode 
                        ? "border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-950/20" 
                        : ticketCaseBlackCtaButtonClassName
                    )}
                    variant={internalMode ? "outline" : "default"}
                  >
                    {internalMode ? "Send Internal Note" : "Send Message"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>


        <TabsContent value="organizer" className="mt-0 border-0 p-0">
          {viewerIsStaff && (
            <div className="border-b border-border bg-muted/30 px-6 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Tax Organizer</h3>
                  <p className="text-xs text-muted-foreground">
                    View client's tax organizer responses and generate PDF summary
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  PDF generation available after build fix
                </div>
              </div>
            </div>
          )}
          <TaxOrganizerPanel
            key={ticket.id}
            ticketId={ticket.id}
            initialAnswers={organizerAnswers}
            onNavigatePastLastSection={() => setActiveTab('documents')}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-0 p-3 sm:p-6">
          <div className="space-y-4">
            {viewerIsStaff && (
              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-medium mb-3">Request Document</h3>
                <form
                  action={async (formData: FormData) => {
                    setRequestingDocument(true);
                    try {
                      await requestDocumentAction(formData);
                      toast({ title: 'Document requested successfully' });
                    } catch (error) {
                      toast({ title: 'Failed to request document', variant: 'destructive' });
                    } finally {
                      setRequestingDocument(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Input
                      id="documentType"
                      name="documentType"
                      placeholder="e.g., W-2, 1099, Passport"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Note (optional)</Label>
                    <Textarea
                      id="note"
                      name="note"
                      placeholder="Additional instructions for the client"
                      rows={2}
                    />
                  </div>
                  <Button type="submit" disabled={requestingDocument}>
                    {requestingDocument ? 'Requesting...' : 'Request Document'}
                  </Button>
                </form>
              </div>
            )}
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Documents</div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                    <TableHead className="min-w-[200px] text-right"> </TableHead>
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
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button variant="ghost" size="icon" title="View document" asChild>
                              <Link href={doc.url} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {viewerIsStaff ? <ReplaceDocumentButton documentId={doc.id} /> : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Same document list as the client portal; uploads are managed from the client account.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-0 p-3 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Tax Return Drafts</div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Shared</TableHead>
                    <TableHead className="min-w-[220px] text-right"> </TableHead>
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
                        <div className="flex flex-wrap justify-end gap-2">
                          {draftBadgePresentation(draftReviewMap[d.id]?.status)?.label ? (
                            <Badge className={draftBadgePresentation(draftReviewMap[d.id]?.status)?.className}>
                              {draftBadgePresentation(draftReviewMap[d.id]?.status)?.label}
                            </Badge>
                          ) : null}
                          {viewerIsStaff ? <ReplaceDocumentButton documentId={d.id} /> : null}
                          {viewerIsStaff ? (
                            <form action={deleteTicketDocumentFormAction}>
                              <input type="hidden" name="documentId" value={d.id} />
                              <Button type="submit" variant="ghost" size="icon" aria-label="Delete draft">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </form>
                          ) : null}
                          {viewerIsStaff ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => approveDraft(d.id)}
                                disabled={reviewingDraftId === d.id}
                              >
                                Approve
                              </Button>
                              <AlertDialog
                                open={rejectDialogOpenForDraftId === d.id}
                                onOpenChange={(open) => setRejectDialogOpenForDraftId(open ? d.id : null)}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button type="button" size="sm" variant="destructive">
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="backdrop-blur-[4px]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to reject this draft?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action will notify the preparer and mark the draft as rejected.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => {
                                        setRejectReasonOpen(true);
                                        setRejectDialogOpenForDraftId(d.id);
                                      }}
                                    >
                                      Yes, Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : null}
                          {d.url ? (
                            <Button variant="ghost" size="icon" title="Download draft" asChild>
                              <a href={d.url} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Download draft"
                              type="button"
                              onClick={() => openLinkOrNotify(d.url, 'Draft not available yet.')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {draftReviewMap[d.id]?.reason ? (
                          <blockquote className="mt-2 rounded border-l-2 border-red-300 bg-red-50 px-3 py-2 text-left text-xs text-red-700">
                            "{draftReviewMap[d.id]?.reason}"
                          </blockquote>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
            <form
              ref={draftUploadFormRef}
              action={staffUploadDraftFormAction}
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

        <TabsContent value="invoices" className="mt-0 p-3 sm:p-6">
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
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                    <TableHead className="min-w-[220px] text-right"> </TableHead>
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
                        <div className="flex flex-wrap justify-end gap-2">
                          {viewerIsStaff ? <ReplaceDocumentButton documentId={f.id} /> : null}
                          {viewerIsStaff ? (
                            <form action={deleteTicketDocumentFormAction}>
                              <input type="hidden" name="documentId" value={f.id} />
                              <Button type="submit" variant="ghost" size="icon" aria-label="Delete invoice file">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </form>
                          ) : null}
                          {f.url ? (
                            <Button variant="ghost" size="icon" title="Download invoice" asChild>
                              <a href={f.url} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" title="Download invoice" type="button" onClick={() => openLinkOrNotify(f.url, 'Invoice file not available yet.')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
            <form
              ref={invoiceUploadFormRef}
              action={staffUploadInvoiceFileFormAction}
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

        <TabsContent value="final" className="mt-0 p-3 sm:p-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">Final filing package</div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden sm:table-cell">Available</TableHead>
                    <TableHead className="min-w-[220px] text-right"> </TableHead>
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
                        <div className="flex flex-wrap justify-end gap-2">
                          {viewerIsStaff ? <ReplaceDocumentButton documentId={f.id} /> : null}
                          {viewerIsStaff ? (
                            <form action={deleteTicketDocumentFormAction}>
                              <input type="hidden" name="documentId" value={f.id} />
                              <Button type="submit" variant="ghost" size="icon" aria-label="Delete final document">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </form>
                          ) : null}
                          {f.url ? (
                            <Button variant="ghost" size="icon" title="Download final document" asChild>
                              <a href={f.url} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Download final document"
                              type="button"
                              onClick={() => openLinkOrNotify(f.url, 'Final document not available yet.')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
            <form
              ref={finalUploadFormRef}
              action={staffUploadFinalPackageFormAction}
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

        <TabsContent value="history" className="mt-0 p-3 sm:p-6">
          <TicketHistory activities={historyActivities} isStaff={true} />
        </TabsContent>
      </Tabs>
      <Dialog open={rejectReasonOpen} onOpenChange={setRejectReasonOpen}>
        <DialogContent className="backdrop-blur-[4px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reason for rejection</DialogTitle>
            <DialogDescription>
              This reason is required and will appear in the ticket timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="draft-rejection-reason">Reason for rejection</Label>
            <Textarea
              id="draft-rejection-reason"
              placeholder="Explain why this draft is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectReasonOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={submitRejection}
              disabled={rejectReason.trim().length < 10 || !!reviewingDraftId}
            >
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
