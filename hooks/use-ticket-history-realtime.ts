'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { ActivityAction } from '@/lib/types';

export interface TicketActivity {
  id: string;
  ticketId: string;
  actorId: string;
  actorType: 'client' | 'employee' | 'admin';
  actionType: ActivityAction;
  actionDetails: Record<string, any>;
  isVisibleToClient: boolean;
  relatedEntityId?: string;
  relatedEntityType?: 'document' | 'message' | 'organizer';
  createdAt: Date;
}

function activityListSignature(activities: TicketActivity[]): string {
  return [...activities]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => a.id)
    .join(',');
}

/**
 * Realtime subscription for ticket_activities (INSERT only, like messages).
 * Merges new activities into state for live updates.
 */
export function useTicketHistoryRealtime(
  ticketId: string,
  initial: TicketActivity[],
): TicketActivity[] {
  const [activities, setActivities] = useState<TicketActivity[]>(initial);
  const sig = useMemo(() => activityListSignature(initial), [initial]);

  useEffect(() => {
    if (!ticketId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`ticket-history-merge:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_activities',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const raw = payload.new as any;
          const newActivity: TicketActivity = {
            id: raw.id,
            ticketId: raw.ticket_id,
            actorId: raw.actor_id,
            actorType: raw.actor_type,
            actionType: raw.action_type,
            actionDetails: raw.action_details,
            isVisibleToClient: raw.is_visible_to_client,
            relatedEntityId: raw.related_entity_id,
            relatedEntityType: raw.related_entity_type,
            createdAt: new Date(raw.created_at),
          };
          setActivities((prev) => [newActivity, ...prev]); // Prepend newest
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  return activities;
}