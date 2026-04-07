import type { Document, Message, Ticket, TicketDraftFile, TicketFinalDocument, TicketInvoiceRow } from '@/lib/types';

/** Revive dates after JSON serialization from Server → Client Components */
export function hydrateTicket(raw: Record<string, unknown>): Ticket {
  const t = raw as Partial<Ticket>;
  return {
    ...t,
    id: String(t.id),
    clientId: String(t.clientId),
    clientName: String(t.clientName),
    clientEmail: String(t.clientEmail),
    subject: String(t.subject ?? ''),
    description: String(t.description ?? ''),
    stage: t.stage as Ticket['stage'],
    status: t.status as Ticket['status'],
    priority: t.priority as Ticket['priority'],
    taxYear: Number(t.taxYear),
    filingType: String(t.filingType ?? ''),
    documents: (t.documents as Document[] | undefined)?.map((d) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt as unknown as string),
    })) ?? [],
    messages: (t.messages as Message[] | undefined)?.map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt as unknown as string),
    })) ?? [],
    shortCode: t.shortCode,
    drafts: (t.drafts as TicketDraftFile[] | undefined)?.map((d) => ({
      ...d,
      sharedAt: new Date(d.sharedAt as unknown as string),
      url: d.url,
    })),
    invoiceFiles: (t.invoiceFiles as TicketDraftFile[] | undefined)?.map((d) => ({
      ...d,
      sharedAt: new Date(d.sharedAt as unknown as string),
      url: d.url,
    })),
    invoices: (t.invoices as TicketInvoiceRow[] | undefined)?.map((inv) => ({
      ...inv,
      dueDate: inv.dueDate ? new Date(inv.dueDate as unknown as string) : undefined,
      paidAt: inv.paidAt ? new Date(inv.paidAt as unknown as string) : undefined,
    })),
    finalDocuments: (t.finalDocuments as TicketFinalDocument[] | undefined)?.map((f) => ({
      ...f,
      availableAt: f.availableAt ? new Date(f.availableAt as unknown as string) : undefined,
      url: f.url,
    })),
    createdAt: new Date(t.createdAt as unknown as string),
    updatedAt: new Date(t.updatedAt as unknown as string),
    dueDate: t.dueDate ? new Date(t.dueDate as unknown as string) : undefined,
    assignedToId: t.assignedToId,
    assignedToName: t.assignedToName,
  } as Ticket;
}
