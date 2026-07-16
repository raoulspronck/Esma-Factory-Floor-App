import { invoke } from "@tauri-apps/api";
import { Dashboard, Device } from "../types";
import { DeviceData } from "../stores/connectionStore";

export async function getDashboard(): Promise<Dashboard> {
  const raw = await invoke<string>("get_dashboard");
  return JSON.parse(raw);
}

export interface DashboardDataResult {
  // `null` means the backend's upstream fetch failed and it has no cached
  // snapshot — keep current device shapes and retry later. `{}` is a
  // genuinely empty dashboard.
  devices: Record<string, DeviceData> | null;
  values: Record<string, string>;
}

// Single startup call replacing what used to be one `get_device` invoke per
// device plus one `get_last_value` invoke per widget datapoint.
export async function getDashboardData(): Promise<DashboardDataResult> {
  return invoke<DashboardDataResult>("get_dashboard_data");
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
