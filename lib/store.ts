import { create } from 'zustand';

/**
 * Legacy Zustand store — auth is handled by Supabase sessions + server layouts.
 * Extend this store for client-only UI state if needed.
 */
interface AppState {
  // placeholder for future client UI state
}

export const useAppStore = create<AppState>(() => ({}));
