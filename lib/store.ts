import { create } from 'zustand';

interface AppState {
  unreadTickets: Record<string, { unread: boolean; stage: string }>;
  unreadByStage: Record<string, number>;
  totalUnread: number;
  setUnreadSnapshot: (entries: Array<{ ticketId: string; stage: string; unread: boolean }>) => void;
  markTicketRead: (ticketId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  unreadTickets: {},
  unreadByStage: {},
  totalUnread: 0,
  setUnreadSnapshot: (entries) =>
    set(() => {
      const unreadTickets: Record<string, { unread: boolean; stage: string }> = {};
      const unreadByStage: Record<string, number> = {};
      let totalUnread = 0;

      for (const entry of entries) {
        unreadTickets[entry.ticketId] = { unread: entry.unread, stage: entry.stage };
        if (!entry.unread) continue;
        unreadByStage[entry.stage] = (unreadByStage[entry.stage] ?? 0) + 1;
        totalUnread += 1;
      }

      return { unreadTickets, unreadByStage, totalUnread };
    }),
  markTicketRead: (ticketId) =>
    set((state) => {
      const existing = state.unreadTickets[ticketId];
      if (!existing || !existing.unread) return state;
      const nextUnreadTickets = {
        ...state.unreadTickets,
        [ticketId]: { ...existing, unread: false },
      };
      const stage = existing.stage;
      const nextUnreadByStage = { ...state.unreadByStage };
      nextUnreadByStage[stage] = Math.max(0, (nextUnreadByStage[stage] ?? 0) - 1);
      if (nextUnreadByStage[stage] === 0) {
        delete nextUnreadByStage[stage];
      }
      return {
        unreadTickets: nextUnreadTickets,
        unreadByStage: nextUnreadByStage,
        totalUnread: Math.max(0, state.totalUnread - 1),
      };
    }),
}));
