'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface SearchResult {
  result_type: 'client' | 'ticket';
  id: string;
  display_name: string;
  secondary_info: string;
  ticket_stage?: string;
  assigned_employee?: string;
}

type TicketSearchRow = {
  id: string;
  public_ref: number;
  stage: string;
  client_id: string;
  assigned_employee_id: string | null;
};

type ProfileSearchRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function searchClientsAndTickets(
  searchTerm: string,
  _userRole: string,
): Promise<SearchResult[]> {
  const supabase = createClient(await cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const term = searchTerm.trim();
  if (!term) {
    return [];
  }

  const results: SearchResult[] = [];

  try {
    let ticketQuery = supabase
      .from('tickets')
      .select('id, public_ref, stage, client_id, assigned_employee_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (/^\d+$/.test(term)) {
      const ref = parseInt(term, 10);
      ticketQuery = ticketQuery.eq('public_ref', ref);
    } else {
      ticketQuery = ticketQuery.ilike('subject', `%${term}%`);
    }

    const { data: ticketRows, error: ticketError } = await ticketQuery;
    if (ticketError) {
      console.error('Search tickets error:', ticketError);
    } else if (ticketRows?.length) {
      const tickets = ticketRows as TicketSearchRow[];
      const profileIds = [
        ...new Set(
          tickets.flatMap((t) => [t.client_id, t.assigned_employee_id].filter(Boolean) as string[]),
        ),
      ];
      const profileMap: Record<string, ProfileSearchRow> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', profileIds);
        for (const p of (profiles ?? []) as ProfileSearchRow[]) {
          profileMap[p.id] = p;
        }
      }

      for (const ticket of tickets) {
        const client = profileMap[ticket.client_id];
        const assignee = ticket.assigned_employee_id
          ? profileMap[ticket.assigned_employee_id]
          : undefined;
        results.push({
          result_type: 'ticket',
          id: ticket.id,
          display_name: `Ticket #${ticket.public_ref}`,
          secondary_info: client?.full_name || client?.email || 'Unknown Client',
          ticket_stage: ticket.stage,
          assigned_employee: assignee?.full_name ?? undefined,
        });
      }
    }

    const { data: clientRows, error: clientError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'client')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .order('full_name', { ascending: true })
      .limit(10);

    if (clientError) {
      console.error('Search clients error:', clientError);
    } else if (clientRows) {
      for (const client of clientRows as ProfileSearchRow[]) {
        results.push({
          result_type: 'client',
          id: client.id,
          display_name: client.full_name || client.email || 'Client',
          secondary_info: client.email || '',
        });
      }
    }

    return results.slice(0, 15);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}
