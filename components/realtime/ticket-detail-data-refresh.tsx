'use client';

/**
 * Solution 2 — debounced `router.refresh()` when documents, invoices, or stage history change for this ticket.
 * Keeps drafts, uploads, billing, and history in sync without manual refresh (signed URLs stay correct).
 */
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const DEBOUNCE_MS = 400;

export function TicketDetailDataRefresh({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    const supabase = createClient();

    const scheduleRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        router.refresh();
      }, DEBOUNCE_MS);
    };

    const filter = `ticket_id=eq.${ticketId}`;
    const ticketFilter = `id=eq.${ticketId}`;
    const channel = supabase
      .channel(`ticket-detail-refresh:${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: ticketFilter },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents', filter },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter },
        scheduleRefresh,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_history', filter },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [ticketId, router]);

  return null;
}
