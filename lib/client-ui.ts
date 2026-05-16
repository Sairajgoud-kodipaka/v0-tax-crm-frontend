import { TICKET_STAGES } from './constants';
import type { Ticket, TicketStage } from './types';

/** Tab ids for `/client/cases/[id]?tab=` and case tab UIs (must match client + staff case tab shells). */
export const CLIENT_CASE_TAB_IDS = [
  'messages',
  'organizer',
  'documents',
  'drafts',
  'invoices',
  'final',
  'history',
] as const;

export type ClientCaseTabId = (typeof CLIENT_CASE_TAB_IDS)[number];

/** Tabs shown in the case tab bar (messages open via icon + modal). */
export type ClientVisibleCaseTabId = Exclude<ClientCaseTabId, 'messages'>;

export const CLIENT_VISIBLE_CASE_TAB_IDS = CLIENT_CASE_TAB_IDS.filter(
  (id): id is ClientVisibleCaseTabId => id !== 'messages',
);

export const CLIENT_CASE_TAB_LABELS: Record<ClientCaseTabId, string> = {
  messages: 'Messages',
  organizer: 'Tax Organizer',
  documents: 'My Documents',
  drafts: 'Tax Drafts',
  invoices: 'Invoices',
  final: 'Final Documents',
  history: 'History',
};

export function parseClientCaseTabId(value: string | null | undefined): ClientCaseTabId | null {
  if (!value) return null;
  return (CLIENT_CASE_TAB_IDS as readonly string[]).includes(value) ? (value as ClientCaseTabId) : null;
}

export function parseVisibleClientCaseTabId(
  value: string | null | undefined,
): ClientVisibleCaseTabId | null {
  const tab = parseClientCaseTabId(value);
  if (!tab || tab === 'messages') return null;
  return tab;
}

export function isMessagesTabDeepLink(value: string | null | undefined): boolean {
  return value === 'messages';
}

/** Map pipeline stage to the tab clients usually need next (deep links / staff “resume” copy). */
export function suggestedClientCaseTabForStage(stage: TicketStage): ClientCaseTabId {
  switch (stage) {
    case 'pending-info':
      return 'organizer';
    case 'under-prep':
      return 'organizer';
    case 'draft-sent':
    case 'awaiting-approval':
      return 'drafts';
    case 'payment-received':
      return 'invoices';
    case '8879-sent':
      return 'documents';
    case '8879-received':
    case 'filing-completed':
    case 'closed':
      return 'final';
    default:
      return 'organizer';
  }
}

/** Presence sends human tab labels — map back to `?tab=` ids when the client is online. */
export function clientCaseTabIdFromPresenceLabel(label: string | null | undefined): ClientCaseTabId | null {
  if (!label?.trim()) return null;
  const t = label.trim();
  const hit = (Object.entries(CLIENT_CASE_TAB_LABELS) as [ClientCaseTabId, string][]).find(([, l]) => l === t);
  return hit ? hit[0] : null;
}

export function displayTicketRef(ticket: Ticket): string {
  if (ticket.shortCode) return ticket.shortCode;
  const n = ticket.id.replace(/\D/g, '');
  return n.padStart(5, '0') || ticket.id;
}

/** Service Details column: tax year + human-readable filing label */
export function formatServiceDetails(ticket: Ticket): string {
  const filing =
    ticket.filingType === 'Individual 1040'
      ? 'US Individual Income Tax Filing'
      : ticket.filingType;
  return `${ticket.taxYear} - ${filing}`;
}

/** Badge label + styles for the current workflow stage (client + staff case headers). */
export function clientStatusPresentation(ticket: Ticket): { label: string; className: string } {
  const info = TICKET_STAGES[ticket.stage];
  if (!info) {
    return {
      label: ticket.stage,
      className: 'bg-muted text-foreground border border-border',
    };
  }
  return { label: info.label, className: info.color };
}

/** One line for ticket header: local time, 12-hour; adds date when not today. */
export function formatTicketLastUpdatedLine(at: Date): string {
  if (!(at instanceof Date) || Number.isNaN(at.getTime())) return '';
  const time = at.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const today = new Date();
  const sameDay =
    at.getFullYear() === today.getFullYear() &&
    at.getMonth() === today.getMonth() &&
    at.getDate() === today.getDate();
  if (sameDay) return `Last updated at ${time}`;
  const datePart = at.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Last updated ${datePart} at ${time}`;
}
