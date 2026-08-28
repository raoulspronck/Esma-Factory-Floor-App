import { invoke } from "@tauri-apps/api";
import {
  KioskClockResult,
  KioskEmployee,
  KioskResponse,
} from "../types";

// The calls the time-clock modal makes. All the credential handling and the
// HTTP itself live in Rust (commands/kiosk.rs) - this is only the shape of the
// conversation. There is nothing to configure: the Rust side sends the Exalise
// credentials this installation already has.

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

/**
 * Announces that this screen is showing the time clock, so clock events made
 * on the other terminals are pushed here over MQTT.
 *
 * Resolves to whether live updates are actually running. Never rejects for a
 * network failure - the time clock works without this, it just stops being
 * live - so a `false` is worth reflecting in the UI but never worth blocking
 * on.
 */
export function kioskRegisterScreen(): Promise<boolean> {
  return invoke<boolean>("kiosk_register_screen");
}
