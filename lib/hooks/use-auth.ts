"use client";

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  setupCompleted: boolean | null;
  initialize: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
  setSetupCompleted: (value: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  setupCompleted: null,
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ isAuthenticated: false, setupCompleted: null, isLoading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('setup_completed')
        .eq('id', session.user.id)
        .single();

      set({
        isAuthenticated: true,
        setupCompleted: profile?.setup_completed ?? false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ isAuthenticated: false, setupCompleted: null, isLoading: false });
    }
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setSetupCompleted: (value) => set({ setupCompleted: value }),
}));

// Set up auth state listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      useAuth.setState({ isAuthenticated: false, setupCompleted: null });
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      useAuth.getState().initialize();
    }
  });
}