import { create } from "zustand";
import { Alert } from "../types";

interface Rs232Data {
  device?: string;
  datapoint?: string;
  value?: string;
  message: string;
  decimal: string;
}

// Structured "app-log" entries from the backend's unified log_event —
// the same data that's written to logs.txt, so the live view and the log
// file tab always show the same stream.
export interface LogEntry {
  timestamp: string;
  category: string;
  message: string;
}

export interface DeviceData {
  connected?: boolean;
  dataPoint: any[];
}

interface ConnectionState {
  mqttStatus: "connected" | "disconnected";
  rs232Status: "started" | "stopped";
  rs232Error: string;
  rs232Log: Rs232Data[];

  // In-memory last-value cache, kept in sync with the backend via MQTT events.
  // Key format: "deviceKey---datapointKey"
  lastValues: Record<string, string>;

  // When each lastValues entry was last updated (ISO string), for widgets that
  // display value age. Same key format as lastValues.
  lastValueTimestamps: Record<string, string>;

  // Device shape (connected status + datapoint definitions) keyed by device id,
  // hydrated once from `get_dashboard_data` instead of each WidgetCell
  // fetching its own device via `get_device`.
  deviceData: Record<string, DeviceData>;

  // Active alert state
  alerts: Alert[];
  activeAlertMessage: string;

  // File transfer state — written by FileMenu, read by TaskBar's progress bar strip
  fileSend: boolean;
  fileReceive: boolean;
  fileSendStatus: string;
  fileSendProgress: string;
  fileReceivePath: string;
  fileError: string;

  // Live app log — written by HelpMenu (from the "app-log" event), read by
  // the ErrorLog modal's Live tab.
  appLog: LogEntry[];

  // Shutdown countdown — non-null when a backend-requested shutdown is pending
  shutdownSecondsLeft: number | null;

  // Actions
  setMqttStatus: (status: "connected" | "disconnected") => void;
  setRs232Status: (status: "started" | "stopped") => void;
  setRs232Error: (error: string) => void;
  appendRs232Log: (data: Rs232Data) => void;
  setLastValue: (key: string, value: string) => void;
  setLastValues: (values: Record<string, string>) => void;
  setLastValueTimestamp: (key: string, time: string) => void;
  setLastValueTimestamps: (values: Record<string, string>) => void;
  setDeviceData: (data: Record<string, DeviceData>) => void;
  setAlerts: (alerts: Alert[]) => void;
  setActiveAlertMessage: (msg: string) => void;
  setFileSend: (v: boolean) => void;
  setFileReceive: (v: boolean) => void;
  setFileSendStatus: (v: string) => void;
  setFileSendProgress: (v: string) => void;
  setFileReceivePath: (v: string) => void;
  setFileError: (v: string) => void;
  appendAppLog: (entry: LogEntry) => void;
  setShutdownCountdown: (seconds: number | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  mqttStatus: "disconnected",
  rs232Status: "stopped",
  rs232Error: "",
  rs232Log: [],
  lastValues: {},
  lastValueTimestamps: {},
  deviceData: {},
  alerts: [],
  activeAlertMessage: "",
  fileSend: false,
  fileReceive: false,
  fileSendStatus: "",
  fileSendProgress: "",
  fileReceivePath: "",
  fileError: "",
  appLog: [],
  shutdownSecondsLeft: null,

  setMqttStatus: (status) => set({ mqttStatus: status }),
  setRs232Status: (status) => set({ rs232Status: status }),
  setRs232Error: (error) => set({ rs232Error: error }),
  appendRs232Log: (data) =>
    set((state) => ({
      rs232Log: [...state.rs232Log.slice(-200), data],
    })),
  setLastValue: (key, value) =>
    set((state) => ({ lastValues: { ...state.lastValues, [key]: value } })),
  setLastValues: (values) =>
    set((state) => ({ lastValues: { ...state.lastValues, ...values } })),
  setLastValueTimestamp: (key, time) =>
    set((state) => ({
      lastValueTimestamps: { ...state.lastValueTimestamps, [key]: time },
    })),
  setLastValueTimestamps: (values) =>
    set((state) => ({
      lastValueTimestamps: { ...state.lastValueTimestamps, ...values },
    })),
  setDeviceData: (data) => set({ deviceData: data }),
  setAlerts: (alerts) => set({ alerts }),
  setActiveAlertMessage: (msg) => set({ activeAlertMessage: msg }),
  setFileSend: (fileSend) => set({ fileSend }),
  setFileReceive: (fileReceive) => set({ fileReceive }),
  setFileSendStatus: (fileSendStatus) => set({ fileSendStatus }),
  setFileSendProgress: (fileSendProgress) => set({ fileSendProgress }),
  setFileReceivePath: (fileReceivePath) => set({ fileReceivePath }),
  setFileError: (fileError) => set({ fileError }),
  appendAppLog: (entry) =>
    set((state) => ({
      appLog: [...state.appLog.slice(-299), entry],
    })),
  setShutdownCountdown: (shutdownSecondsLeft) => set({ shutdownSecondsLeft }),
}));
