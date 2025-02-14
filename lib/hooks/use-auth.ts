"use client";
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
}
export const useAuth = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }
      set({
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ isAuthenticated: false, isLoading: false });
    }
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));
// Set up auth state listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    if (event === 'SIGNED_OUT' || !session) {
      useAuth.setState({ isAuthenticated: false });
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      useAuth.getState().initialize();
    }
  });
}