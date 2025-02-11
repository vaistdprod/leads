import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

interface InviteState {
  isValid: boolean;
  isLoading: boolean;
  validateInvite: (code: string) => Promise<boolean>;
}

export const useInvite = create<InviteState>((set) => ({
  isValid: false,
  isLoading: true,
  validateInvite: async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .single();

      if (error) throw error;

      const isValid = !!data;
      set({ isValid, isLoading: false });
      return isValid;
    } catch (error) {
      console.error('Failed to validate invite:', error);
      set({ isValid: false, isLoading: false });
      return false;
    }
  },
}));