import { invoke } from "@tauri-apps/api";

export async function sendMessage(
  device_key: string,
  datapoint: string,
  value: string
): Promise<boolean> {
  return invoke<boolean>("send_message", { device_key, datapoint, value });
}

export async function getExaliseConnection(): Promise<boolean> {
  return invoke<boolean>("get_exalise_connection");
}
