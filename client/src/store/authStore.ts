import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'PITCH_OWNER';
  city?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await authApi.me();
      set({ user: response.data.data.user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null });
    }
  },
}));

