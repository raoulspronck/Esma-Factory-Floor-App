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
  // false = last-known-good from disk, true = a live fetch landed this session.
  // Values render either way; this is only for diagnostics.
  fresh: boolean;
}

// Reads the backend's caches. Network-free and lock-free on the Rust side, so it
// always resolves in milliseconds even with the shop-floor wifi down — which is
// the point: widgets paint from the disk-seeded snapshot instead of waiting on a
// fetch that may not succeed for minutes.
export async function getDashboardData(): Promise<DashboardDataResult> {
  return invoke<DashboardDataResult>("get_dashboard_data");
}

// Tells the backend our Tauri listeners are registered, and returns the current
// cache in the same round trip. Closes the race where a `dashboard-hydrated`
// push emitted before the webview was listening was silently dropped by Tauri
// and never retried.
export async function signalFrontendReady(): Promise<DashboardDataResult> {
  return invoke<DashboardDataResult>("frontend_ready");
}

// Asks the background refresher to fetch now. Returns immediately; the result
// arrives as a `dashboard-hydrated` event.
export async function requestDashboardRefresh(): Promise<void> {
  await invoke("request_dashboard_refresh");
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
