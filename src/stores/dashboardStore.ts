import { create } from "zustand";
import { Dashboard, Device, Widget } from "../types";
import * as dashboardApi from "../api/dashboard";

interface DashboardState {
  dashboard: Dashboard;
  isLoading: boolean;

  // Actions
  loadDashboard: () => Promise<void>;
  addDevice: (device: Device) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  reorderDevices: (deviceIdsInOrder: string[]) => Promise<void>;
  addWidget: (deviceId: string, widget: Widget) => Promise<void>;
  removeWidget: (deviceId: string, widgetId: string) => Promise<void>;
  updateWidgetsLayout: (widgets: { id: string; x: number; y: number; w: number; h: number }[]) => Promise<void>;
  setDashboard: (dashboard: Dashboard) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboard: { version: 3, devices: [] },
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

  removeDevice: async (deviceId: string) => {
    const { dashboard } = get();
    const updated: Dashboard = {
      ...dashboard,
      devices: dashboard.devices.filter((d) => d.id !== deviceId),
    };
    await dashboardApi.saveDashboardLayout(updated);
    set({ dashboard: updated });
  },

  // Device strip order on the dashboard is just the array order — no x/y
  // stored per device — so reordering is a pure array reshuffle.
  reorderDevices: async (deviceIdsInOrder: string[]) => {
    const { dashboard } = get();
    const byId = new Map(dashboard.devices.map((d) => [d.id, d]));
    const reordered = deviceIdsInOrder
      .map((id) => byId.get(id))
      .filter((d): d is Device => d !== undefined);
    const updated: Dashboard = { ...dashboard, devices: reordered };
    await dashboardApi.saveDashboardLayout(updated);
    set({ dashboard: updated });
  },

  addWidget: async (deviceId: string, widget: Widget) => {
    const { dashboard } = get();
    const updated: Dashboard = {
      ...dashboard,
      devices: dashboard.devices.map((d) =>
        d.id === deviceId ? { ...d, widgets: [widget, ...d.widgets] } : d
      ),
    };
    const saved = await dashboardApi.saveWidgetToDashboard(updated);
    set({ dashboard: saved });
  },

  removeWidget: async (deviceId: string, widgetId: string) => {
    const { dashboard } = get();
    const updated: Dashboard = {
      ...dashboard,
      devices: dashboard.devices.map((d) =>
        d.id === deviceId ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) } : d
      ),
    };
    await dashboardApi.saveDashboardLayout(updated);
    set({ dashboard: updated });
  },

  updateWidgetsLayout: async (widgets) => {
    const { dashboard } = get();
    const byId = new Map(widgets.map((w) => [w.id, w]));
    const updated: Dashboard = {
      ...dashboard,
      devices: dashboard.devices.map((d) => ({
        ...d,
        widgets: d.widgets.map((w) => {
          const placed = byId.get(w.id);
          return placed ? { ...w, x: placed.x, y: placed.y, w: placed.w, h: placed.h } : w;
        }),
      })),
    };
    await dashboardApi.saveDashboardLayout(updated);
    set({ dashboard: updated });
  },

  setDashboard: (dashboard: Dashboard) => set({ dashboard }),
}));
