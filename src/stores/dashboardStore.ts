import { create } from "zustand";
import { Dashboard, Device, Widget, GridLayout } from "../types";
import * as dashboardApi from "../api/dashboard";

interface DashboardState {
  dashboard: Dashboard;
  isLoading: boolean;

  // Actions
  loadDashboard: () => Promise<void>;
  addDevice: (device: Device) => Promise<void>;
  updateWidget: (deviceId: string, widget: Widget) => Promise<void>;
  updateLayout: (layout: GridLayout[]) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  setDashboard: (dashboard: Dashboard) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboard: { layout: [], devices: [] },
  isLoading: false,

  loadDashboard: async () => {
    set({ isLoading: true });
    try {
      const dashboard = await dashboardApi.getDashboard();
      set({ dashboard, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  addDevice: async (device: Device) => {
    const updated = await dashboardApi.saveDeviceToDashboard(device);
    set({ dashboard: updated });
  },

  updateWidget: async (deviceId: string, widget: Widget) => {
    const { dashboard } = get();
    const updated: Dashboard = {
      ...dashboard,
      devices: dashboard.devices.map((d) =>
        d.id === deviceId
          ? { ...d, widgets: d.widgets.map((w) => (w.id === widget.id ? widget : w)) }
          : d
      ),
    };
    const saved = await dashboardApi.saveWidgetToDashboard(updated);
    set({ dashboard: saved });
  },

  updateLayout: async (layout: GridLayout[]) => {
    const { dashboard } = get();
    const updated = { ...dashboard, layout };
    await dashboardApi.saveDashboardLayout(updated);
    set({ dashboard: updated });
  },

  removeDevice: async (deviceId: string) => {
    const { dashboard } = get();
    const updated: Dashboard = {
      layout: dashboard.layout.filter((l) => l.i !== deviceId),
      devices: dashboard.devices.filter((d) => d.id !== deviceId),
    };
    await dashboardApi.saveDashboardLayout(updated);
    set({ dashboard: updated });
  },

  setDashboard: (dashboard: Dashboard) => set({ dashboard }),
}));
