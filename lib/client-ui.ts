import { TICKET_STAGES } from './constants';
import type { Ticket } from './types';

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
