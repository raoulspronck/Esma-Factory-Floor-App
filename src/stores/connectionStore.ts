import { create } from "zustand";
import { Alert } from "../types";

interface Rs232Data {
  device?: string;
  datapoint?: string;
  value?: string;
  message: string;
  decimal: string;
}

interface ConnectionState {
  mqttStatus: "connected" | "disconnected";
  rs232Status: "started" | "stopped";
  rs232Error: string;
  rs232Log: Rs232Data[];

  // In-memory last-value cache, kept in sync with the backend via MQTT events.
  // Key format: "deviceKey---datapointKey"
  lastValues: Record<string, string>;

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

  // Connection error log — written by HelpMenu, read by ErrorLog modal
  connectionErrorLog: string[];

  // Shutdown countdown — non-null when a backend-requested shutdown is pending
  shutdownSecondsLeft: number | null;

  // Actions
  setMqttStatus: (status: "connected" | "disconnected") => void;
  setRs232Status: (status: "started" | "stopped") => void;
  setRs232Error: (error: string) => void;
  appendRs232Log: (data: Rs232Data) => void;
  setLastValue: (key: string, value: string) => void;
  setAlerts: (alerts: Alert[]) => void;
  setActiveAlertMessage: (msg: string) => void;
  setFileSend: (v: boolean) => void;
  setFileReceive: (v: boolean) => void;
  setFileSendStatus: (v: string) => void;
  setFileSendProgress: (v: string) => void;
  setFileReceivePath: (v: string) => void;
  setFileError: (v: string) => void;
  appendConnectionError: (msg: string) => void;
  setShutdownCountdown: (seconds: number | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  mqttStatus: "disconnected",
  rs232Status: "stopped",
  rs232Error: "",
  rs232Log: [],
  lastValues: {},
  alerts: [],
  activeAlertMessage: "",
  fileSend: false,
  fileReceive: false,
  fileSendStatus: "",
  fileSendProgress: "",
  fileReceivePath: "",
  fileError: "",
  connectionErrorLog: [],
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
  setAlerts: (alerts) => set({ alerts }),
  setActiveAlertMessage: (msg) => set({ activeAlertMessage: msg }),
  setFileSend: (fileSend) => set({ fileSend }),
  setFileReceive: (fileReceive) => set({ fileReceive }),
  setFileSendStatus: (fileSendStatus) => set({ fileSendStatus }),
  setFileSendProgress: (fileSendProgress) => set({ fileSendProgress }),
  setFileReceivePath: (fileReceivePath) => set({ fileReceivePath }),
  setFileError: (fileError) => set({ fileError }),
  appendConnectionError: (msg) =>
    set((state) => ({
      connectionErrorLog: [...state.connectionErrorLog.slice(-49), msg],
    })),
  setShutdownCountdown: (shutdownSecondsLeft) => set({ shutdownSecondsLeft }),
}));
