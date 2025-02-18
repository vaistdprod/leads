import { create } from 'zustand';

interface ProcessingState {
  isProcessing: boolean;
  totalContacts: number | null;
  processedContacts: number;
  progress: number;
  setProcessing: (isProcessing: boolean) => void;
  setTotalContacts: (total: number | null) => void;
  setProcessedContacts: (processed: number) => void;
  reset: () => void;
}

export const useProcessingState = create<ProcessingState>((set) => ({
  isProcessing: false,
  totalContacts: null,
  processedContacts: 0,
  progress: 0,
  setProcessing: (isProcessing) => set({ isProcessing }),
  setTotalContacts: (totalContacts) => set({ totalContacts }),
  setProcessedContacts: (processedContacts) => 
    set((state) => ({
      processedContacts,
      progress: state.totalContacts ? (processedContacts / state.totalContacts) * 100 : 0,
    })),
  reset: () => set({
    isProcessing: false,
    totalContacts: null,
    processedContacts: 0,
    progress: 0,
  }),
}));
