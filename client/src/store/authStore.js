import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sosDuration: 1500,
      autoShareLocation: true,

      login: ({ user, accessToken, refreshToken }) => {
        set({ user, accessToken, refreshToken });
      },

      updateTokens: ({ accessToken, refreshToken }) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        }));
      },

      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),

      setSosDuration: (duration) => set({ sosDuration: duration }),
      setAutoShareLocation: (enabled) => set({ autoShareLocation: enabled }),

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => !!get().accessToken,
      isAdmin: () => get().user?.role === 'admin',
      isVolunteer: () => get().user?.role === 'volunteer',
    }),
    {
      name: 'guardian-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sosDuration: state.sosDuration,
        autoShareLocation: state.autoShareLocation,
      }),
    }
  )
);
