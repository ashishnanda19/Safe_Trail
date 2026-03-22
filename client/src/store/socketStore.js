import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,

  setSocket: (socket) => set({ socket }),

  setConnected: (isConnected) => set({ isConnected }),

  clearSocket: () => set({ socket: null, isConnected: false }),
}));
