// Central type definitions — mirror the Rust model structs.

// Format v3: each device owns a 2-column × 8-row strip on the dashboard
// (array order = strip order, max 5 devices). Widget x/y/w/h are LOCAL to
// the device's strip (x 0..1, w 1..2, y 0..7, h 1..8). `version` marks the
// format so the Rust side can migrate older files.
export interface Dashboard {
  version: number;
  devices: Device[];
}

export interface Device {
  id: string;
  name: string;
  key: string;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  datapoints: string[];
}

export interface ExaliseSettings {
  mqtt_settings: {
    mqtt_key: string;
    mqtt_secret: string;
    device_key: string;
  };
  http_settings: {
    http_key: string;
    http_secret: string;
  };
  rs232_settings: {
    port_name: string;
    baud_rate: number;
    data_bits_number: number;
    parity_string: number;
    stop_bits_number: number;
  };
}

export interface ApiSettings {
  username: string;
  password: string;
}

export interface KioskEmployee {
  id: string;
  firstName: string;
  lastName: string;
  isCheckedIn: boolean;
  checkedInSince: string | null;
  hasPin: boolean;
}

// The expected failures a terminal has to render differently, named rather
// than left as HTTP statuses so the screen never has to know how the two
// backends spell them. See commands/kiosk.rs.
export type KioskOutcome =
  | "ok"
  | "unconfigured"
  | "unauthenticated"
  | "wrong_pin"
  | "no_pin"
  | "cooldown"
  | "not_found"
  | "offline"
  | "error";

export interface KioskResponse<T> {
  outcome: KioskOutcome;
  data?: T;
  retryAfterMs?: number;
  message?: string;
}

export interface KioskClockResult {
  status: "IN" | "OUT" | "undone" | string;
  employeeName: string;
  time: string;
}

// One clock event as it arrives over MQTT, pushed by the message handler to
// every terminal currently showing the time clock so a tap on one screen is
// visible on the rest without anyone refreshing. Mirrors `ClockUpdate` in
// message-handler.exalise.com's utils/kioskScreens.ts.
export interface ClockUpdate {
  employeeId: string;
  employeeName: string;
  status: "IN" | "OUT" | "undone";
  // The state the employee ends up in, which is what a tile renders. Sent
  // rather than derived, so "undone" does not have to be interpreted here.
  isCheckedIn: boolean;
  time: string;
  // Audit sentinel of whatever submitted it: "KIOSK", "REMOTE-APP", or an RFID
  // card UID. Not displayed - it is here so a screen could tell its own taps
  // from somebody else's if that ever became useful.
  source: string;
}

export interface BasicSettings {
  gesture_control: string;
  automatic_load_dashboard: string;
  // Rows per device strip on the dashboard grid; optional because older
  // basic.settings.json files don't have it yet.
  dashboard_rows?: number;
}

export interface Alert {
  device_key: string;
  data_point: string;
  require_accept?: string;
}

export interface Alerts {
  alerts: Alert[];
}

export type ConnectionStatus = "connected" | "disconnected";
