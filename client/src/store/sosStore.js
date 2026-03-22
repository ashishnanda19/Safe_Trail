import { create } from 'zustand';

export const useSosStore = create((set) => ({
  activeSosId: null,
  triggeredAt: null,
  guardianCount: 0,
  status: null,

  setActive: ({ sosEventId, triggeredAt, guardianCount }) => {
    set({ activeSosId: sosEventId, triggeredAt, guardianCount, status: 'active' });
  },

  clear: () => {
    set({ activeSosId: null, triggeredAt: null, guardianCount: 0, status: null });
  },
}));
