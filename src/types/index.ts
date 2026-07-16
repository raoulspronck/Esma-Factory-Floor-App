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
