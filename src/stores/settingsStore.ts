import { create } from "zustand";
import { ExaliseSettings, ApiSettings, BasicSettings } from "../types";
import * as settingsApi from "../api/settings";

interface SettingsState {
  exalise: ExaliseSettings | null;
  api: ApiSettings | null;
  basic: BasicSettings | null;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  refreshExalise: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  exalise: null,
  api: null,
  basic: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const [exalise, api, basic] = await Promise.all([
        settingsApi.getExaliseSettings(),
        settingsApi.getApiSettings(),
        settingsApi.getBasicSettings(),
      ]);
      set({ exalise, api, basic, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  refreshExalise: async () => {
    try {
      const exalise = await settingsApi.getExaliseSettings();
      set({ exalise });
    } catch (_) {}
  },
}));
