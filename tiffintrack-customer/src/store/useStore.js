import { create } from "zustand";
import { persist } from "zustand/middleware";

// Global state store using Zustand
// Persists user and token to localStorage
export const useStore = create(
  persist(
    (set) => ({
      // Auth state
      user: null,
      token: null,

      // Chat state
      chatOpen: false,

      // Actions
      setUser: (user, token) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      setChatOpen: (open) => set({ chatOpen: open }),
    }),
    {
      name: "tiffintrack-auth",
      // Only persist auth data, not chat state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
