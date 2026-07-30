import { invoke } from "@tauri-apps/api";

export async function readLogFile(): Promise<string> {
  return invoke<string>("read_log_file");
}
