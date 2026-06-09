import { invoke } from "@tauri-apps/api";
import { Dashboard, Device } from "../types";

export async function getDashboard(): Promise<Dashboard> {
  const raw = await invoke<string>("get_dashboard");
  return JSON.parse(raw);
}

export async function saveDashboardLayout(dashboard: Dashboard): Promise<void> {
  await invoke("save_dashboard_layout", { dashboard });
}

export async function saveDeviceToDashboard(device: Device): Promise<Dashboard> {
  return invoke<Dashboard>("save_device_to_dashboard", { device });
}

export async function saveWidgetToDashboard(dashboard: Dashboard): Promise<Dashboard> {
  return invoke<Dashboard>("save_widget_to_dashboard", { dashboard });
}
