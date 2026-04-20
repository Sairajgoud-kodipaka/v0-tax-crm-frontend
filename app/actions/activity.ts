'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { ActivityAction } from '@/lib/types';

interface LogActivityPayload {
  ticketId: string;
  actionType: ActivityAction;
  details?: Record<string, unknown>;
  isVisibleToClient?: boolean;
  relatedEntityId?: string | null;
  relatedEntityType?: 'document' | 'message' | 'organizer' | null;
}

export async function logTicketActivityAction(payload: LogActivityPayload) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.rpc('log_ticket_activity', {
    p_ticket_id: payload.ticketId,
    p_actor_id: user.id,
    p_action_type: payload.actionType,
    p_details: payload.details ?? {},
    p_is_visible_to_client: payload.isVisibleToClient ?? false,
    p_related_entity_id: payload.relatedEntityId,
    p_related_entity_type: payload.relatedEntityType,
  });

  if (error) {
    console.error('log_ticket_activity failed', error.message);
    throw new Error(error.message);
  }
}
