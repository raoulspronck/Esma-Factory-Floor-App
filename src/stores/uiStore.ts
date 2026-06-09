import { create } from "zustand";

interface UiState {
  login: boolean;
  layoutChangable: boolean;
  setLogin: (login: boolean) => void;
  setLayoutChangable: (changable: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  login: false,
  layoutChangable: false,
  setLogin: (login) => set({ login }),
  setLayoutChangable: (layoutChangable) => set({ layoutChangable }),
}));
