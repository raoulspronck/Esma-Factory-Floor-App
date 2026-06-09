// Central type definitions — mirror the Rust model structs.

export interface Dashboard {
  layout: GridLayout[];
  devices: Device[];
}

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Device {
  id: string;
  name: string;
  key: string;
  display: boolean;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  name: string;
  height: number;
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
