import { invoke } from "@tauri-apps/api";
import { Alert, ApiSettings, BasicSettings, ExaliseSettings } from "../types";

export async function getExaliseSettings(): Promise<ExaliseSettings> {
  const raw = await invoke<string>("get_exalise_settings");
  return JSON.parse(raw);
}

export async function saveExaliseMqttSettings(
  mqtt_key: string,
  mqtt_secret: string,
  device_key: string
): Promise<void> {
  await invoke("save_exalise_mqtt_settings", { mqtt_key, mqtt_secret, device_key });
}

export async function saveExaliseHttpSettings(
  http_key: string,
  http_secret: string
): Promise<void> {
  await invoke("save_exalise_http_settings", { http_key, http_secret });
}

export async function saveRs232Settings(
  port_name: string,
  baud_rate: number,
  data_bits_number: number,
  parity_string: number,
  stop_bits_number: number
): Promise<void> {
  await invoke("save_rs232_settings", {
    port_name,
    baud_rate,
    data_bits_number,
    parity_string,
    stop_bits_number,
  });
}

export async function getApiSettings(): Promise<ApiSettings> {
  const raw = await invoke<string>("get_api_settings");
  return JSON.parse(raw);
}

export async function saveApiSettings(username: string, password: string): Promise<void> {
  await invoke("save_api_settings", { username, password });
}

export async function getBasicSettings(): Promise<BasicSettings> {
  const raw = await invoke<string>("get_basic_settings");
  return JSON.parse(raw);
}

export async function saveBasicSettings(
  gesture: string,
  dashboard: string,
  rows: number
): Promise<void> {
  await invoke("save_basic_settings", { gesture, dashboard, rows });
}

export async function getAlerts(): Promise<Alert[]> {
  const raw = await invoke<string>("get_alerts");
  const parsed = JSON.parse(raw);
  return parsed.alerts ?? [];
}

export async function saveAlerts(alert_items: Alert[]): Promise<void> {
  await invoke("save_alerts", { alert_items });
}
