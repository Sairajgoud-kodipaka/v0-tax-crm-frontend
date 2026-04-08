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
