'use client';

/**
 * Solution 2 — any `tickets` row change the user is allowed to see (RLS) triggers a debounced
 * `router.refresh()` so queue lists and dashboard stats stay current without manual reload.
 */
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const DEBOUNCE_MS = 500;

export function QueueRealtimeRefresh() {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        router.refresh();
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel('queues-tickets-refresh')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
