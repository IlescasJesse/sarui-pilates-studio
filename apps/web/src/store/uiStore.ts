import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  toggle: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,

      toggle: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) =>
        set({ sidebarOpen: open }),
    }),
    {
      name: "sarui-ui",
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);
