import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";

import { useConnectionStore } from "../stores/connectionStore";
import { useDashboardStore } from "../stores/dashboardStore";

/**
 * EventManager — mounts once in App.tsx and owns ALL Tauri event subscriptions.
 * Writes to Zustand stores so any component can reactively consume the data
 * without each component subscribing to Tauri events individually.
 */
export default function EventManager(): null {
  const setMqttStatus = useConnectionStore((s) => s.setMqttStatus);
  const setRs232Status = useConnectionStore((s) => s.setRs232Status);
  const setRs232Error = useConnectionStore((s) => s.setRs232Error);
  const appendRs232Log = useConnectionStore((s) => s.appendRs232Log);
  const setLastValue = useConnectionStore((s) => s.setLastValue);
  const alerts = useConnectionStore((s) => s.alerts);
  const setActiveAlertMessage = useConnectionStore((s) => s.setActiveAlertMessage);
  const setShutdownCountdown = useConnectionStore((s) => s.setShutdownCountdown);

  const dashboard = useDashboardStore((s) => s.dashboard);

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    const subscribe = async () => {
      // MQTT connection status
      unlisteners.push(
        await listen<string>("exalise-connection", (e) => {
          setMqttStatus(e.payload === "connected" ? "connected" : "disconnected");
        })
      );

      // Shutdown countdown requested by the backend
      unlisteners.push(
        await listen<number>("shutdown-requested", (e) => {
          setShutdownCountdown(e.payload);
        })
      );

      // RS232 monitor status
      unlisteners.push(
        await listen<string>("rs232-status", (e) => {
          setRs232Status(e.payload as "started" | "stopped");
        })
      );

      // RS232 errors
      unlisteners.push(
        await listen<string>("rs232-error", (e) => {
          setRs232Error(e.payload);
        })
      );

      // RS232 data — forward valid datapoints to MQTT, log everything
      unlisteners.push(
        await listen<string>("rs232", (e) => {
          try {
            const json = JSON.parse(e.payload);
            appendRs232Log(json);
            if (json.value && json.device && json.datapoint) {
              invoke("send_message", {
                deviceKey: json.device,
                datapoint: json.datapoint,
                value: json.value,
              }).catch(console.error);
            }
          } catch (_) {}
        })
      );

      // MQTT notification events — update last-value cache
      // Subscribe once per device datapoint in the current dashboard
      const deviceSubscriptions = new Set<string>();
      for (const device of dashboard.devices) {
        for (const widget of device.widgets) {
          for (const dp of widget.datapoints) {
            const key = `${device.key}---${dp}`;
            if (!deviceSubscriptions.has(key)) {
              deviceSubscriptions.add(key);
              const eventName = `notification---${key}`;
              listen<string>(eventName, (e) => {
                setLastValue(key, e.payload);
                // Check alerts
                for (const alert of alerts) {
                  if (alert.device_key === device.key && alert.data_point === dp) {
                    setActiveAlertMessage(e.payload);
                  }
                }
              }).then((fn) => unlisteners.push(fn));
            }
          }
        }
      }
    };

    subscribe();

    return () => {
      unlisteners.forEach((fn) => fn());
    };
    // Re-subscribe when the dashboard devices change (new devices/datapoints added).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard.devices]);

  return null;
}
