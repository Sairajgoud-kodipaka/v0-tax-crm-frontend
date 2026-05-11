import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { ActivityAction, Ticket, TicketStage, UserRole } from '@/lib/types';
import { mapDocumentRow, mapMessageRow, mapTicketRow } from '@/lib/data/map-ticket';
import type { SessionUser } from '@/lib/session-user';

// cache() deduplicates calls within the same server request — layout + page
// share one result instead of each making their own DB round-trips.
export const getServerSupabase = cache(async () => {
  return createClient(await cookies());
});

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Middleware sets these headers after validating the session and fetching the
  // profile — so layouts and pages pay zero extra DB calls for auth.
  const hdrs = await headers();
  const id = hdrs.get('x-user-id');
  const role = hdrs.get('x-user-role') as UserRole | null;

  if (id && role) {
    const email = hdrs.get('x-user-email') ?? '';
    return {
      id,
      email,
      name: hdrs.get('x-user-name') || email.split('@')[0] || 'User',
      role,
    };
  }

  // Fallback for contexts where middleware headers are not available
  // (e.g. Server Actions called directly).
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return null;

  const { data: profileRaw, error: pErr } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileRaw as { full_name: string | null; email: string | null; role: UserRole } | null;

  if (pErr || !profile) return null;

  return {
    id: user.id,
    email: user.email ?? profile.email ?? '',
    name: profile.full_name ?? user.email?.split('@')[0] ?? 'User',
    role: profile.role as UserRole,
  };
});

const DEFAULT_STAGE: TicketStage = 'pending-info';

type ProfileRow = { id: string; full_name: string | null; email: string | null };
type TicketRow = Parameters<typeof mapTicketRow>[0];
type MessageRow = Parameters<typeof mapMessageRow>[0];
type DocumentRow = {
  id: string;
  ticket_id: string;
  category: string;
  size_bytes: number | null;
  storage_path: string;
  uploaded_by: string | null;
  original_filename: string | null;
  shared_at: string | null;
  available_at: string | null;
  created_at: string;
};
type InvoiceRow = {
  id: string;
  invoice_number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
};
type TicketHistoryRow = {
  id: string;
  actor_id: string;
  from_stage: string | null;
  to_stage: string;
  note: string | null;
  created_at: string;
};

type TicketActivityRow = {
  id: string;
  ticket_id: string;
  actor_id: string;
  actor_type: string;
  action_type: string;
  action_details: Record<string, unknown>;
  is_visible_to_client: boolean;
  related_entity_id: string | null;
  related_entity_type: string | null;
  created_at: string;
};

async function profileMapForIds(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  ids: string[],
): Promise<Record<string, ProfileRow>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return {};
  const { data: profileRowsRaw } = await supabase.from('profiles').select('id, full_name, email').in('id', unique);
  const data = (profileRowsRaw ?? []) as ProfileRow[];
  const map: Record<string, ProfileRow> = {};
  for (const p of data) {
    map[p.id] = p;
  }
  return map;
}

const TICKET_LIST_COLUMNS =
  'id, public_ref, client_id, assigned_employee_id, stage, status, priority, subject, filing_type, tax_year, due_date, created_at, updated_at' as const;

export async function listTicketsForStage(
  stage: TicketStage | null | undefined,
  _role: 'admin' | 'employee',
  _employeeUserId: string,
): Promise<Ticket[]> {
  const supabase = await getServerSupabase();
  const st = stage ?? DEFAULT_STAGE;

  const q = supabase.from('tickets').select(TICKET_LIST_COLUMNS).eq('stage', st).order('updated_at', { ascending: false });

  const { data: rowsRaw, error } = await q;
  const rows = (rowsRaw ?? []) as TicketRow[];
  if (error || !rows?.length) {
    if (error) console.error('listTicketsForStage', error);
    return [];
  }

  const ids = rows.flatMap((r) => [r.client_id, r.assigned_employee_id].filter(Boolean) as string[]);
  const pmap = await profileMapForIds(supabase, ids);

  return rows.map((row) => {
    const client = pmap[row.client_id];
    const assignee = row.assigned_employee_id ? pmap[row.assigned_employee_id] : undefined;
    return mapTicketRow(row, {
      clientName: client?.full_name ?? 'Client',
      clientEmail: client?.email ?? '',
      assignedToName: assignee?.full_name ?? undefined,
      documents: [],
      messages: [],
    });
  });
}

/** All tickets visible to staff (employee queues are shared across the team). */
export async function listAllTicketsForStaff(): Promise<Ticket[]> {
  const supabase = await getServerSupabase();
  const { data: rowsRaw, error } = await supabase.from('tickets').select(TICKET_LIST_COLUMNS).order('updated_at', { ascending: false });
  const rows = (rowsRaw ?? []) as TicketRow[];

  if (error || !rows?.length) return [];

  const ids = rows.flatMap((r) => [r.client_id, r.assigned_employee_id].filter(Boolean) as string[]);
  const pmap = await profileMapForIds(supabase, ids);

  return rows.map((row) => {
    const client = pmap[row.client_id];
    const assignee = row.assigned_employee_id ? pmap[row.assigned_employee_id] : undefined;
    return mapTicketRow(row, {
      clientName: client?.full_name ?? 'Client',
      clientEmail: client?.email ?? '',
      assignedToName: assignee?.full_name ?? undefined,
      documents: [],
      messages: [],
    });
  });
}

export async function listTicketsForClient(clientId: string): Promise<Ticket[]> {
  const supabase = await getServerSupabase();
  const { data: rowsRaw, error } = await supabase
    .from('tickets')
    .select(TICKET_LIST_COLUMNS)
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false });
  const rows = (rowsRaw ?? []) as TicketRow[];

  if (error || !rows?.length) return [];

  const ids = rows.flatMap((r) => [r.client_id, r.assigned_employee_id].filter(Boolean) as string[]);
  const pmap = await profileMapForIds(supabase, ids);

  return rows.map((row) => {
    const client = pmap[row.client_id];
    const assignee = row.assigned_employee_id ? pmap[row.assigned_employee_id] : undefined;
    return mapTicketRow(row, {
      clientName: client?.full_name ?? 'Client',
      clientEmail: client?.email ?? '',
      assignedToName: assignee?.full_name ?? undefined,
      documents: [],
      messages: [],
    });
  });
}

async function signedUrlForPath(supabase: Awaited<ReturnType<typeof getServerSupabase>>, path: string) {
  const { data, error } = await supabase.storage.from('tax-documents').createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return '#';
  return data.signedUrl;
}

export async function getTicketDetailBundle(
  ticketId: string,
  role: UserRole,
  userId: string,
): Promise<Ticket | null> {
  const supabase = await getServerSupabase();

  // Phase 1: fetch ticket
  const { data: ticketRaw, error: tErr } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();
  const ticket = ticketRaw as TicketRow | null;
  if (tErr || !ticket) return null;

  const allowed =
    role === 'admin' ||
    role === 'employee' ||
    (role === 'client' && ticket.client_id === userId);
  if (!allowed) return null;

  // Phase 2: all independent fetches in parallel
  const assigneeQuery = ticket.assigned_employee_id
    ? supabase.from('profiles').select('full_name').eq('id', ticket.assigned_employee_id).maybeSingle()
    : Promise.resolve({ data: null });

  const [
    { data: clientRaw },
    { data: assigneeRaw },
    { data: msgRowsRaw },
    { data: docRowsRaw },
    { data: invRowsRaw },
    { data: historyRowsRaw },
    { data: activityRowsRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', ticket.client_id).maybeSingle(),
    assigneeQuery,
    supabase.from('messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }),
    supabase.from('documents').select('*').eq('ticket_id', ticketId),
    supabase.from('invoices').select('*').eq('ticket_id', ticketId),
    supabase.from('ticket_history').select('id, actor_id, from_stage, to_stage, note, created_at').eq('ticket_id', ticketId).order('created_at', { ascending: false }),
    supabase.from('ticket_activities').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false }),
  ]);

  const client = clientRaw as { full_name: string | null; email: string | null } | null;
  const assignee = assigneeRaw as { full_name: string | null } | null;
  const msgRows = (msgRowsRaw ?? []) as MessageRow[];
  const docRows = (docRowsRaw ?? []) as DocumentRow[];
  const invRows = (invRowsRaw ?? []) as InvoiceRow[];
  const historyRows = (historyRowsRaw ?? []) as TicketHistoryRow[];
  const activityRows = (activityRowsRaw ?? []) as TicketActivityRow[];

  // Phase 3: profile lookups + all signed URLs in parallel
  const uploaderIds = [...new Set(docRows.map((d) => d.uploaded_by).filter(Boolean) as string[])];
  const historyActorIds = [...new Set(historyRows.map((h) => h.actor_id).filter(Boolean) as string[])];
  const allStoragePaths = docRows.map((d) => d.storage_path);

  const [uploaders, historyActors, signedUrls] = await Promise.all([
    profileMapForIds(supabase, uploaderIds),
    profileMapForIds(supabase, historyActorIds),
    Promise.all(allStoragePaths.map((path) => signedUrlForPath(supabase, path))),
  ]);

  // Build path → url map to avoid duplicate signed URL calls
  const urlMap: Record<string, string> = {};
  for (let i = 0; i < docRows.length; i++) {
    urlMap[docRows[i].storage_path] = signedUrls[i];
  }

  const messages = msgRows.map((m) => mapMessageRow(m));

  const documents = docRows.map((d) => {
    const up = d.uploaded_by ? uploaders[d.uploaded_by] : undefined;
    return mapDocumentRow(
      { ...d, uploader: up ? { full_name: up.full_name } : null },
      urlMap[d.storage_path],
    );
  });

  const clientUploadDocs = docRows
    .map((d, i) => ({ d, doc: documents[i] }))
    .filter(({ d }) => d.category === 'client_upload')
    .map(({ doc }) => doc);

  const invoices = invRows.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    description: inv.description ?? '',
    amountCents: inv.amount_cents,
    status: inv.status as 'paid' | 'unpaid',
    dueDate: inv.due_date ? new Date(inv.due_date) : undefined,
    paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
  }));

  const drafts = docRows
    .filter((d) => d.category === 'draft')
    .map((d) => ({
      id: d.id,
      name: d.original_filename ?? 'Draft',
      sharedAt: d.shared_at ? new Date(d.shared_at) : new Date(d.created_at),
      url: urlMap[d.storage_path],
    }));

  const invoiceFiles = docRows
    .filter((d) => d.category === 'other')
    .map((d) => ({
      id: d.id,
      name: d.original_filename ?? 'Invoice file',
      sharedAt: new Date(d.created_at),
      url: urlMap[d.storage_path],
    }));

  const finalDocuments = docRows
    .filter((d) => d.category === 'final')
    .map((d) => ({
      id: d.id,
      name: d.original_filename ?? 'Document',
      availableAt: d.available_at ? new Date(d.available_at) : undefined,
      url: urlMap[d.storage_path],
    }));

  const history = historyRows.map((h) => ({
    id: h.id,
    actorId: h.actor_id,
    actorName: historyActors[h.actor_id]?.full_name ?? historyActors[h.actor_id]?.email ?? 'System',
    fromStage: (h.from_stage ?? undefined) as TicketStage | undefined,
    toStage: h.to_stage as TicketStage,
    note: h.note ?? undefined,
    createdAt: new Date(h.created_at),
  }));

  const activities = activityRows.map((a) => ({
    id: a.id,
    ticketId: a.ticket_id,
    actorId: a.actor_id,
    actorType: a.actor_type as 'client' | 'employee' | 'admin',
    actionType: a.action_type as ActivityAction,
    actionDetails: a.action_details ?? {},
    isVisibleToClient: a.is_visible_to_client,
    relatedEntityId: a.related_entity_id ?? undefined,
    relatedEntityType: (a.related_entity_type as 'document' | 'message' | 'organizer') ?? undefined,
    createdAt: new Date(a.created_at),
  }));

  const staffDocs = role === 'client' ? clientUploadDocs : documents;

  const mappedTicket = mapTicketRow(ticket, {
    clientName: client?.full_name ?? 'Client',
    clientEmail: client?.email ?? '',
    assignedToName: assignee?.full_name ?? undefined,
    documents: staffDocs,
    messages,
    drafts,
    invoiceFiles,
    invoices,
    finalDocuments,
    history,
  });

  return {
    ...mappedTicket,
    activities,
  };
}

export async function getTicketForClientCase(ticketId: string, clientId: string): Promise<Ticket | null> {
  return getTicketDetailBundle(ticketId, 'client', clientId);
}
