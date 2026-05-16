import type { SupabaseClient } from '@supabase/supabase-js';

/** Remove leftover channel (Strict Mode remounts or duplicate hooks on the same ticket). */
export function removeSupabaseChannelByName(supabase: SupabaseClient, channelName: string) {
  const topic = `realtime:${channelName}`;
  for (const ch of supabase.getChannels()) {
    if (ch.topic === topic) {
      void supabase.removeChannel(ch);
    }
  }
}
