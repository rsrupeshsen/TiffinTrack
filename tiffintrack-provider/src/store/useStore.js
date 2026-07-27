import { create } from "zustand";
import { persist } from "zustand/middleware";

// Global state store using Zustand
// Mirrors tiffintrack-customer's store, but uses its own localStorage key
// so a provider and a customer session can coexist in the same browser.
export const useStore = create(
  persist(
    (set) => ({
      // Auth state
      user: null,
      token: null,

      // The provider's kitchen profile (providers table row).
      // null until GET /api/provider/profile succeeds.
      kitchen: null,

      // Actions
      setUser: (user, token) => set({ user, token }),
      setKitchen: (kitchen) => set({ kitchen }),
      logout: () => set({ user: null, token: null, kitchen: null }),
    }),
    {
      name: "tiffintrack-provider-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        kitchen: state.kitchen,
      }),
    },
  ),
);
