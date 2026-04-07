import 'server-only';

import { getServerSupabase } from '@/lib/data/tickets-queries';
import { STAGE_NAVIGATION } from '@/lib/constants';
import type { Ticket } from '@/lib/types';
import { mapTicketRow } from '@/lib/data/map-ticket';

export type AdminDashboardData = {
  totalTickets: number;
  openTickets: number;
  completedThisMonth: number;
  overdueTasks: number;
  stageBreakdown: Record<string, number>;
  recentTickets: Ticket[];
  employees: { id: string; name: string; email: string | null; department: string }[];
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await getServerSupabase();

  const { data: allTickets, error: tErr } = await supabase.from('tickets').select('*');
  if (tErr || !allTickets) {
    return {
      totalTickets: 0,
      openTickets: 0,
      completedThisMonth: 0,
      overdueTasks: 0,
      stageBreakdown: {},
      recentTickets: [],
      employees: [],
    };
  }

  const stageBreakdown: Record<string, number> = {};
  for (const s of STAGE_NAVIGATION) {
    stageBreakdown[s.id] = 0;
  }
  for (const row of allTickets) {
    const st = row.stage as string;
    stageBreakdown[st] = (stageBreakdown[st] ?? 0) + 1;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const openTickets = allTickets.filter(
    (t) => t.stage !== 'closed' && t.status !== 'completed',
  ).length;

  const completedThisMonth = allTickets.filter((t) => {
    const u = new Date(t.updated_at);
    return u >= monthStart && (t.stage === 'filing-completed' || t.stage === 'closed');
  }).length;

  const overdueTasks = allTickets.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < now && t.stage !== 'closed';
  }).length;

  const ids = allTickets.flatMap((r) => [r.client_id, r.assigned_employee_id].filter(Boolean) as string[]);
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role').in('id', [...new Set(ids)]);

  const pmap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const sorted = [...allTickets].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const recent = sorted.slice(0, 5).map((row) => {
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

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'employee');

  const employees =
    staff?.map((e) => ({
      id: e.id,
      name: e.full_name ?? 'Employee',
      email: e.email,
      department: 'Tax',
    })) ?? [];

  return {
    totalTickets: allTickets.length,
    openTickets,
    completedThisMonth,
    overdueTasks,
    stageBreakdown,
    recentTickets: recent,
    employees,
  };
}
