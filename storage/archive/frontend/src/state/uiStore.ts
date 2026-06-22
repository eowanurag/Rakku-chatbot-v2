import { create } from "zustand";

interface UIState {
  theme: "light" | "dark";
  isSidebarOpen: boolean;
  activeModalId: string | null;
  toggleTheme: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  openModal: (modalId: string | null) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  isSidebarOpen: false,
  activeModalId: null,
  toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  openModal: (modalId) => set({ activeModalId: modalId }),
  closeModal: () => set({ activeModalId: null }),
}));
