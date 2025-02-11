"use client";

import { create } from 'zustand';

interface SettingsState {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
}));