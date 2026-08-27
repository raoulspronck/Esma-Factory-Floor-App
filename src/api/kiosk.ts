import { invoke } from "@tauri-apps/api";
import {
  KioskClockResult,
  KioskEmployee,
  KioskResponse,
} from "../types";

// The three calls the time-clock modal makes. All the credential handling and
// the HTTP itself live in Rust (commands/kiosk.rs) - this is only the shape of
// the conversation.

export function kioskGetEmployees(): Promise<KioskResponse<KioskEmployee[]>> {
  return invoke<KioskResponse<KioskEmployee[]>>("kiosk_get_employees");
}

/// First PIN only. The API refuses to overwrite an existing one, so this is
/// safe to offer from a screen anybody on the floor can walk up to.
export function kioskSetInitialPin(
  employeeId: string,
  pin: string
): Promise<KioskResponse<null>> {
  return invoke<KioskResponse<null>>("kiosk_set_initial_pin", { employeeId, pin });
}

export function kioskClock(
  employeeId: string,
  pin: string,
  clientEventId: string
): Promise<KioskResponse<KioskClockResult>> {
  return invoke<KioskResponse<KioskClockResult>>("kiosk_clock", {
    employeeId,
    pin,
    clientEventId,
  });
}
