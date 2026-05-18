import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';

/** Server-only Supabase client (bypasses RLS). Used for transactional email lookups. */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
