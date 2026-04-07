import type {
  Document,
  Message,
  Ticket,
  TicketDraftFile,
  TicketFinalDocument,
  TicketHistoryEntry,
  TicketInvoiceRow,
  TicketStage,
  TicketStatus,
  TicketPriority,
  UserRole,
} from '@/lib/types';

type DbTicket = {
  id: string;
  public_ref: number;
  client_id: string;
  assigned_employee_id: string | null;
  stage: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  filing_type: string;
  tax_year: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  client?: { full_name: string | null; id: string } | null;
  employee?: { full_name: string | null; id: string } | null;
};

export function mapTicketRow(
  row: DbTicket,
  extras: {
    clientName: string;
    clientEmail: string;
    assignedToName?: string;
    documents: Document[];
    messages: Message[];
    drafts?: TicketDraftFile[];
    invoiceFiles?: TicketDraftFile[];
    invoices?: TicketInvoiceRow[];
    finalDocuments?: TicketFinalDocument[];
    history?: TicketHistoryEntry[];
  },
): Ticket {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: extras.clientName,
    clientEmail: extras.clientEmail,
    subject: row.subject,
    description: row.description,
    stage: row.stage as TicketStage,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    assignedToId: row.assigned_employee_id ?? undefined,
    assignedToName: extras.assignedToName,
    taxYear: row.tax_year,
    filingType: row.filing_type,
    documents: extras.documents,
    messages: extras.messages,
    shortCode: String(row.public_ref),
    drafts: extras.drafts,
    invoiceFiles: extras.invoiceFiles,
    invoices: extras.invoices,
    finalDocuments: extras.finalDocuments,
    history: extras.history,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
  };
}

export function mapMessageRow(
  row: {
    id: string;
    ticket_id: string;
    sender_id: string;
    body: string;
    is_internal: boolean;
    created_at: string;
    sender_display_name?: string | null;
    sender_role?: string | null;
    sender?: { full_name: string | null; role: string } | null;
  },
): Message {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderName: row.sender_display_name ?? row.sender?.full_name ?? 'User',
    senderRole: ((row.sender_role ?? row.sender?.role ?? 'client') as string) as UserRole,
    content: row.body,
    createdAt: new Date(row.created_at),
    isInternal: row.is_internal,
  };
}

export function mapDocumentRow(
  row: {
    id: string;
    ticket_id: string;
    original_filename: string | null;
    size_bytes: number | null;
    storage_path: string;
    created_at: string;
    uploaded_by: string | null;
    uploader?: { full_name: string | null } | null;
  },
  signedUrl: string,
): Document {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    name: row.original_filename ?? row.storage_path.split('/').pop() ?? 'file',
    type: 'file',
    size: row.size_bytes ?? 0,
    url: signedUrl,
    uploadedBy: row.uploader?.full_name ?? 'Unknown',
    uploadedAt: new Date(row.created_at),
  };
}
