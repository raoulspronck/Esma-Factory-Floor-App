import { invoke } from "@tauri-apps/api";

export async function getDevices(): Promise<unknown[]> {
  const raw = await invoke<string>("get_devices");
  return JSON.parse(raw);
}

export async function getDevice(device_id: string): Promise<unknown> {
  const raw = await invoke<string>("get_device", { device_id });
  return JSON.parse(raw);
}

export async function getOwnDevice(): Promise<unknown> {
  const raw = await invoke<string>("get_own_device");
  return JSON.parse(raw);
}

export async function getLastValue(
  device_id: string,
  device_key: string,
  datapoint_key: string
): Promise<string> {
  return invoke<string>("get_last_value", { device_id, device_key, datapoint_key });
}

export async function removeCache(): Promise<void> {
  await invoke("post_remove_cache");
}
