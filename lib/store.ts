import { create } from 'zustand';
import { User, UserRole } from './types';
import { mockUsers, mockEmployees } from './mock-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Simple password validation for demo (in real app, this would be server-side)
const demoCredentials: Record<string, { password: string; userId: string }> = {
  'admin@taxcrm.com': { password: 'admin123', userId: 'admin-1' },
  'employee@taxcrm.com': { password: 'employee123', userId: 'employee-1' },
  'client@taxcrm.com': { password: 'client123', userId: 'client-1' },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const credentials = demoCredentials[email];
    if (credentials && credentials.password === password) {
      const user = mockUsers[credentials.userId];
      if (user) {
        set({ user, isAuthenticated: true });
        // Store in sessionStorage for persistence during session
        sessionStorage.setItem('authUser', JSON.stringify(user));
        return;
      }
    }
    throw new Error('Invalid email or password');
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    sessionStorage.removeItem('authUser');
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: user !== null });
    if (user) {
      sessionStorage.setItem('authUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('authUser');
    }
  },
}));

// Initialize auth state from sessionStorage on mount
if (typeof window !== 'undefined') {
  const storedUser = sessionStorage.getItem('authUser');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      useAuthStore.setState({ user, isAuthenticated: true });
    } catch (e) {
      sessionStorage.removeItem('authUser');
    }
  }
}
