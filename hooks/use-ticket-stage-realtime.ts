'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TICKET_STAGES } from '@/lib/constants';
import type { TicketStage } from '@/lib/types';

function parseStage(value: unknown): TicketStage | null {
  if (typeof value !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(TICKET_STAGES, value) ? (value as TicketStage) : null;
}

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface TicketStageRealtimeState {
  stage: TicketStage;
  /** Mirrors `tickets.updated_at` — updates when the row changes (stage or other fields). */
  lastUpdatedAt: Date;
}

/**
 * Always-on Supabase Realtime subscription for `tickets` row updates (RLS applies).
 * Keeps workflow `stage` and `lastUpdatedAt` in sync across users and tabs.
 */
export function useTicketStageRealtime(
  ticketId: string,
  initialStage: TicketStage,
  initialUpdatedAt: Date,
): TicketStageRealtimeState {
  const [stage, setStage] = useState<TicketStage>(initialStage);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(() =>
    initialUpdatedAt instanceof Date && !Number.isNaN(initialUpdatedAt.getTime())
      ? initialUpdatedAt
      : new Date(),
  );

  useEffect(() => {
    setStage(initialStage);
    setLastUpdatedAt(
      initialUpdatedAt instanceof Date && !Number.isNaN(initialUpdatedAt.getTime())
        ? initialUpdatedAt
        : new Date(),
    );
  }, [initialStage, initialUpdatedAt, ticketId]);

  useEffect(() => {
    if (!ticketId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`ticket-stage:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          const row = payload.new as { stage?: unknown; updated_at?: unknown };
          const at = parseTimestamp(row?.updated_at) ?? new Date();
          setLastUpdatedAt(at);
          const nextStage = parseStage(row?.stage);
          if (nextStage) setStage(nextStage);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticketId]);

  return { stage, lastUpdatedAt };
}
