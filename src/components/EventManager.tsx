import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";

import { useConnectionStore } from "../stores/connectionStore";
import { useDashboardStore } from "../stores/dashboardStore";
import { getDashboardData } from "../api/dashboard";
import { emitter } from "../index";

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
  const setLastValues = useConnectionStore((s) => s.setLastValues);
  const setLastValueTimestamp = useConnectionStore((s) => s.setLastValueTimestamp);
  const setLastValueTimestamps = useConnectionStore((s) => s.setLastValueTimestamps);
  const setDeviceData = useConnectionStore((s) => s.setDeviceData);
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
                setLastValueTimestamp(key, new Date().toISOString());
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

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const fetchDashboardData = (attempt = 0) => {
      if (retryTimer !== undefined) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }

      getDashboardData()
        .then(({ devices, values }) => {
          if (cancelled) return;
          setDeviceData(devices);

          // Each entry in `values` is the same JSON-wrapped shape the old
          // per-widget get_last_value calls used to return
          // (`{id, value, key, createdAt}`, stringified). Unwrap into the
          // plain-value/timestamp cache widgets read reactively.
          const rawValues: Record<string, string> = {};
          const timestamps: Record<string, string> = {};
          for (const [key, wrapped] of Object.entries(values)) {
            try {
              const parsed = JSON.parse(wrapped);
              rawValues[key] = parsed.value;
              if (parsed.createdAt) timestamps[key] = parsed.createdAt;
            } catch (_) {}
          }
          setLastValues(rawValues);
          setLastValueTimestamps(timestamps);
        })
        .catch((err) => {
          console.error(err);
          if (cancelled) return;
          // Fetch failures right after launch are usually transient (network
          // not up yet post Windows-login autostart) - back off and retry
          // instead of leaving the dashboard permanently blank until the
          // user notices and clicks "Refetch" themselves.
          const delay = Math.min(2000 * 2 ** attempt, 30000);
          retryTimer = setTimeout(() => fetchDashboardData(attempt + 1), delay);
        });
    };

    // Initial hydration - one call instead of one `get_device` per device plus
    // one `get_last_value` per widget datapoint.
    fetchDashboardData();

    // The taskbar's "Refetch" button clears the backend cache then emits this;
    // re-running the same fetch repopulates both stores from fresh data.
    const onRefetch = () => fetchDashboardData();
    emitter.on("refetch", onRefetch);
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
      emitter.off("refetch", onRefetch);
    };
  }, [setDeviceData, setLastValues, setLastValueTimestamps]);

  return null;
}
