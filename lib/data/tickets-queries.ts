import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { Ticket, TicketStage, UserRole } from '@/lib/types';
import { mapDocumentRow, mapMessageRow, mapTicketRow } from '@/lib/data/map-ticket';
import type { SessionUser } from '@/lib/session-user';

export async function getServerSupabase() {
  return createClient(await cookies());
}

export async function getSessionUser(): Promise<SessionUser | null> {
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
}

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

export async function listTicketsForStage(
  stage: TicketStage | null | undefined,
  role: 'admin' | 'employee',
  employeeUserId: string,
): Promise<Ticket[]> {
  const supabase = await getServerSupabase();
  const st = stage ?? DEFAULT_STAGE;

  let q = supabase.from('tickets').select('*').eq('stage', st).order('updated_at', { ascending: false });

  if (role === 'employee') {
    q = q.eq('assigned_employee_id', employeeUserId);
  }

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

export async function listTicketsAssignedToEmployee(employeeId: string): Promise<Ticket[]> {
  const supabase = await getServerSupabase();
  const { data: rowsRaw, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('assigned_employee_id', employeeId)
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

export async function listTicketsForClient(clientId: string): Promise<Ticket[]> {
  const supabase = await getServerSupabase();
  const { data: rowsRaw, error } = await supabase
    .from('tickets')
    .select('*')
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

  const { data: ticketRaw, error: tErr } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();
  const ticket = ticketRaw as TicketRow | null;
  if (tErr || !ticket) return null;

  const { data: clientRaw } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', ticket.client_id)
    .maybeSingle();
  const client = clientRaw as { full_name: string | null; email: string | null } | null;

  const { data: assigneeRaw } = ticket.assigned_employee_id
    ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ticket.assigned_employee_id)
        .maybeSingle()
    : { data: null };
  const assignee = assigneeRaw as { full_name: string | null } | null;

  const allowed =
    role === 'admin' ||
    (role === 'employee' && ticket.assigned_employee_id === userId) ||
    (role === 'client' && ticket.client_id === userId);

  if (!allowed) return null;

  const { data: msgRowsRaw } = await supabase
    .from('messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  const msgRows = (msgRowsRaw ?? []) as MessageRow[];

  const messages = msgRows.map((m) => mapMessageRow(m));

  const { data: docRowsRaw } = await supabase.from('documents').select('*').eq('ticket_id', ticketId);
  const docRows = (docRowsRaw ?? []) as DocumentRow[];

  const uploaderIds = [...new Set(docRows.map((d) => d.uploaded_by).filter(Boolean) as string[])];
  const uploaders = await profileMapForIds(supabase, uploaderIds);

  const documents = await Promise.all(
    docRows.map(async (d) => {
      const url = await signedUrlForPath(supabase, d.storage_path);
      const up = d.uploaded_by ? uploaders[d.uploaded_by] : undefined;
      return mapDocumentRow(
        {
          ...d,
          uploader: up ? { full_name: up.full_name } : null,
        },
        url,
      );
    }),
  );

  const clientUploadDocs = docRows
    .map((d, i) => ({ d, doc: documents[i] }))
    .filter(({ d }) => d.category === 'client_upload')
    .map(({ doc }) => doc);

  const { data: invRowsRaw } = await supabase.from('invoices').select('*').eq('ticket_id', ticketId);
  const invRows = (invRowsRaw ?? []) as InvoiceRow[];

  const invoices = invRows.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      description: inv.description ?? '',
      amountCents: inv.amount_cents,
      status: inv.status as 'paid' | 'unpaid',
      dueDate: inv.due_date ? new Date(inv.due_date) : undefined,
      paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
    }));

  const draftRows = docRows.filter((d) => d.category === 'draft');
  const drafts =
    (await Promise.all(
      draftRows.map(async (d) => ({
        id: d.id,
        name: d.original_filename ?? 'Draft',
        sharedAt: d.shared_at ? new Date(d.shared_at) : new Date(d.created_at),
        url: await signedUrlForPath(supabase, d.storage_path),
      })),
    )) ?? [];

  const invoiceFileRows = docRows.filter((d) => d.category === 'other');
  const invoiceFiles =
    (await Promise.all(
      invoiceFileRows.map(async (d) => ({
        id: d.id,
        name: d.original_filename ?? 'Invoice file',
        sharedAt: new Date(d.created_at),
        url: await signedUrlForPath(supabase, d.storage_path),
      })),
    )) ?? [];

  const finalRows = docRows.filter((d) => d.category === 'final');
  const finalDocuments =
    (await Promise.all(
      finalRows.map(async (d) => ({
        id: d.id,
        name: d.original_filename ?? 'Document',
        availableAt: d.available_at ? new Date(d.available_at) : undefined,
        url: await signedUrlForPath(supabase, d.storage_path),
      })),
    )) ?? [];

  const { data: historyRowsRaw } = await supabase
    .from('ticket_history')
    .select('id, actor_id, from_stage, to_stage, note, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  const historyRows = (historyRowsRaw ?? []) as TicketHistoryRow[];
  const historyActorIds = [...new Set(historyRows.map((h) => h.actor_id).filter(Boolean) as string[])];
  const historyActors = await profileMapForIds(supabase, historyActorIds);
  const history = historyRows.map((h) => ({
      id: h.id,
      actorId: h.actor_id,
      actorName: historyActors[h.actor_id]?.full_name ?? historyActors[h.actor_id]?.email ?? 'System',
      fromStage: (h.from_stage ?? undefined) as TicketStage | undefined,
      toStage: h.to_stage as TicketStage,
      note: h.note ?? undefined,
      createdAt: new Date(h.created_at),
    }));

  const staffDocs = role === 'client' ? clientUploadDocs : documents;

  return mapTicketRow(ticket, {
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
}

export async function getTicketForClientCase(ticketId: string, clientId: string): Promise<Ticket | null> {
  return getTicketDetailBundle(ticketId, 'client', clientId);
}
