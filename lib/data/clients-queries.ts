import 'server-only';

import { getServerSupabase } from '@/lib/data/tickets-queries';

export type ClientDirectoryRow = {
  profile_id: string;
  full_name: string | null;
  email: string | null;
  assigned_employee_id: string | null;
  assignee_name: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  ticket_count: number;
};

export type EmployeeClientTicketRow = {
  ticket_id: string;
  ticket_ref: string;
  client_id: string;
  client_name: string;
  stage: string;
  status: string;
  assigned_since: string;
  last_activity: string;
};

type ClientJoinRow = {
  profile_id: string;
  assigned_employee_id: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export async function listEmployeesForClientFilter(): Promise<Array<{ id: string; full_name: string | null }>> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'employee')
    .order('full_name', { ascending: true, nullsFirst: false });
  if (error) return [];
  return (data ?? []) as Array<{ id: string; full_name: string | null }>;
}

export async function listClientDirectory(options: {
  q?: string;
  assignedFilter?: string;
}): Promise<ClientDirectoryRow[]> {
  const supabase = await getServerSupabase();
  let q = supabase
    .from('clients')
    .select(
      `
      profile_id,
      assigned_employee_id,
      notes,
      status,
      created_at
    `,
    )
    .order('created_at', { ascending: false })
    .limit(2000);

  const af = options.assignedFilter ?? 'all';
  if (af === 'unassigned') {
    q = q.is('assigned_employee_id', null);
  } else if (af !== 'all') {
    q = q.eq('assigned_employee_id', af);
  }

  const { data: raw, error } = await q;
  if (error || !raw) return [];

  let rows = raw as ClientJoinRow[];

  const clientProfileIds = [...new Set(rows.map((r) => r.profile_id))];
  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (clientProfileIds.length > 0) {
    const { data: clientProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', clientProfileIds);
    for (const p of (clientProfiles ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    }
  }

  const search = options.q?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((r) => {
      const fn = profileMap[r.profile_id]?.full_name?.toLowerCase() ?? '';
      const em = profileMap[r.profile_id]?.email?.toLowerCase() ?? '';
      return fn.includes(search) || em.includes(search);
    });
  }

  const empIds = [...new Set(rows.map((r) => r.assigned_employee_id).filter(Boolean) as string[])];
  const empMap: Record<string, string | null> = {};
  if (empIds.length > 0) {
    const { data: emps } = await supabase.from('profiles').select('id, full_name').in('id', empIds);
    for (const e of (emps ?? []) as Array<{ id: string; full_name: string | null }>) {
      empMap[e.id] = e.full_name;
    }
  }

  const { data: ticketRows } = await supabase.from('tickets').select('client_id');
  const ticketCount = new Map<string, number>();
  for (const t of (ticketRows ?? []) as Array<{ client_id: string }>) {
    ticketCount.set(t.client_id, (ticketCount.get(t.client_id) ?? 0) + 1);
  }

  return rows.map((r) => ({
    profile_id: r.profile_id,
    full_name: profileMap[r.profile_id]?.full_name ?? null,
    email: profileMap[r.profile_id]?.email ?? null,
    assigned_employee_id: r.assigned_employee_id,
    assignee_name: r.assigned_employee_id ? (empMap[r.assigned_employee_id] ?? null) : null,
    notes: r.notes,
    status: r.status,
    created_at: r.created_at,
    ticket_count: ticketCount.get(r.profile_id) ?? 0,
  }));
}

export async function listEmployeeClientTickets(employeeId: string): Promise<EmployeeClientTicketRow[]> {
  const supabase = await getServerSupabase();
  const { data: ticketRows, error } = await supabase
    .from('tickets')
    .select('id, public_ref, client_id, stage, status, created_at, updated_at, assigned_employee_id')
    .eq('assigned_employee_id', employeeId)
    .order('updated_at', { ascending: false });
  if (error || !ticketRows) return [];

  const clientIds = [...new Set(ticketRows.map((t) => t.client_id).filter(Boolean) as string[])];
  const { data: clientProfiles } = clientIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', clientIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> };
  const clientMap: Record<string, string> = {};
  for (const p of (clientProfiles ?? []) as Array<{ id: string; full_name: string | null }>) {
    clientMap[p.id] = p.full_name?.trim() || 'Client';
  }

  return (ticketRows as Array<{
    id: string;
    public_ref: string | null;
    client_id: string;
    stage: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>).map((row) => ({
    ticket_id: row.id,
    ticket_ref: row.public_ref ?? row.id.slice(0, 8),
    client_id: row.client_id,
    client_name: clientMap[row.client_id] ?? 'Client',
    stage: row.stage,
    status: row.status,
    assigned_since: row.created_at,
    last_activity: row.updated_at,
  }));
}

/** Counts tickets where `assigned_employee_id` is set (primary handler in this app). */
export type StaffTicketAssignmentCounts = {
  total: number;
  /** Tickets whose status is not `completed` (still in the preparer’s pipeline). */
  active: number;
};

/** One DB read; aggregate in memory. Used for admin team roster. */
export async function getTicketAssignmentCountsByEmployee(): Promise<Record<string, StaffTicketAssignmentCounts>> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from('tickets').select('assigned_employee_id, status').not('assigned_employee_id', 'is', null);
  if (error || !data) return {};

  const map: Record<string, StaffTicketAssignmentCounts> = {};
  for (const row of data as Array<{ assigned_employee_id: string; status: string }>) {
    const id = row.assigned_employee_id;
    if (!map[id]) map[id] = { total: 0, active: 0 };
    map[id].total += 1;
    if (row.status !== 'completed') map[id].active += 1;
  }
  return map;
}

/** Admins + employees for “view by staff member” switchers (not the same as preparer-only lists). */
export async function listStaffProfilesForAdminSwitcher(): Promise<Array<{ id: string; full_name: string | null }>> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['admin', 'employee'])
    .order('full_name', { ascending: true, nullsFirst: false });
  if (error) return [];
  return (data ?? []) as Array<{ id: string; full_name: string | null }>;
}
