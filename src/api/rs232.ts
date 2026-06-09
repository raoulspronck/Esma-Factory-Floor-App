import { invoke } from "@tauri-apps/api";

export async function getAvailablePorts(): Promise<string[]> {
  return invoke<string[]>("get_all_availble_ports");
}

export async function startFileSend(params: {
  file_path: string;
  send_in_pieces: number;
  max_char: number;
  delay: number;
  listen_cnc: number;
  stop_char: number;
  restart_char: number;
}): Promise<string> {
  return invoke<string>("start_file_send", params);
}

export async function stopFileSend(): Promise<boolean> {
  return invoke<boolean>("stop_file_send");
}

export async function startFileReceive(params: {
  file_path: string;
  start_decimal: number;
  stop_decimal: number;
  forbidden_decimals: number[];
}): Promise<string> {
  return invoke<string>("start_file_receive", params);
}

export async function stopFileReceive(file_path: string): Promise<boolean> {
  return invoke<boolean>("stop_file_receive", { file_path });
}
