import 'server-only';

import { STAGE_NAVIGATION } from '@/lib/constants';
import { getServerSupabase, listTicketsAssignedToEmployee } from '@/lib/data/tickets-queries';

export async function getEmployeeDashboardData(employeeId: string) {
  const myTickets = await listTicketsAssignedToEmployee(employeeId);
  const inProgressCount = myTickets.filter((t) => t.status === 'in-progress').length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = myTickets.filter(
    (t) =>
      new Date(t.updatedAt) >= monthStart && (t.stage === 'closed' || t.stage === 'filing-completed'),
  ).length;

  const supabase = await getServerSupabase();
  const { data: allRows } = await supabase.from('tickets').select('stage');
  const stageBreakdown: Record<string, number> = {};
  for (const s of STAGE_NAVIGATION) {
    stageBreakdown[s.id] = 0;
  }
  for (const row of allRows ?? []) {
    const st = row.stage as string;
    stageBreakdown[st] = (stageBreakdown[st] ?? 0) + 1;
  }

  const stageData = STAGE_NAVIGATION.map((s) => ({
    name: s.label,
    value: stageBreakdown[s.id] ?? 0,
  }));

  return {
    myTickets,
    inProgressCount,
    completedThisMonth,
    stageData,
  };
}
