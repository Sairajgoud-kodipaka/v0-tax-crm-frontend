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

export function clientStatusPresentation(ticket: Ticket): { label: string; className: string } {
  if (ticket.stage === 'closed' || ticket.stage === 'filing-completed') {
    return { label: 'Completed', className: 'bg-zinc-200 text-zinc-900 border border-zinc-300' };
  }
  return {
    label: 'Pending Information',
    className: 'bg-amber-400 text-amber-950 border border-amber-500',
  };
}
