import type { UserRole } from '@/lib/types';

/** Minimal user shape for dashboard shell (from Supabase auth + profiles) */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
