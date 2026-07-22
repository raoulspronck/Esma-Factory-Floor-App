import { useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";

import { useConnectionStore, DeviceData } from "../stores/connectionStore";
import { useDashboardStore } from "../stores/dashboardStore";
import { getDashboardData, DashboardDataResult } from "../api/dashboard";
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
  const setActiveAlertMessage = useConnectionStore((s) => s.setActiveAlertMessage);
  const setShutdownCountdown = useConnectionStore((s) => s.setShutdownCountdown);

  const dashboard = useDashboardStore((s) => s.dashboard);

  // Changes exactly when the set of devices or subscribed datapoints changes —
  // NOT on pure layout edits (drag/resize), which also produce new device
  // array references. Both effects below key on this, so adding a device or
  // widget re-subscribes + re-hydrates, while moving widgets around doesn't
  // churn Tauri listeners or refetch anything.
  const hydrationSignature = useMemo(() => {
    const keys: string[] = [];
    for (const device of dashboard.devices) {
      keys.push(device.id);
      for (const widget of device.widgets) {
        for (const dp of widget.datapoints) {
          keys.push(`${device.key}---${dp}`);
        }
      }
    }
    return JSON.stringify(keys.sort());
  }, [dashboard.devices]);

  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    // Registers a listener, and if this effect was already cleaned up by the
    // time Tauri resolves the registration, immediately unlistens instead of
    // pushing into an array nobody will iterate again. The old code pushed
    // via .then into the previous pass's array — those listeners leaked and
    // every dashboard change duplicated the notification subscriptions.
    const track = (registration: Promise<() => void>) => {
      registration.then((fn) => {
        if (cancelled) fn();
        else unlisteners.push(fn);
      });
    };

    // MQTT connection status
    track(
      listen<string>("exalise-connection", (e) => {
        setMqttStatus(e.payload === "connected" ? "connected" : "disconnected");
      })
    );

    // Shutdown countdown requested by the backend
    track(
      listen<number>("shutdown-requested", (e) => {
        setShutdownCountdown(e.payload);
      })
    );

    // RS232 monitor status
    track(
      listen<string>("rs232-status", (e) => {
        setRs232Status(e.payload as "started" | "stopped");
      })
    );

    // RS232 errors
    track(
      listen<string>("rs232-error", (e) => {
        setRs232Error(e.payload);
      })
    );

    // RS232 data — forward valid datapoints to MQTT, log everything
    track(
      listen<string>("rs232", (e) => {
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

    // MQTT notification events — update last-value cache.
    // Subscribe once per device datapoint in the current dashboard.
    const deviceSubscriptions = new Set<string>();
    for (const device of dashboard.devices) {
      for (const widget of device.widgets) {
        for (const dp of widget.datapoints) {
          const key = `${device.key}---${dp}`;
          if (deviceSubscriptions.has(key)) continue;
          deviceSubscriptions.add(key);

          track(
            listen<string>(`notification---${key}`, (e) => {
              setLastValue(key, e.payload);
              setLastValueTimestamp(key, new Date().toISOString());
              // Read alerts from the store at event time — capturing the
              // array here froze the (initially empty) list loaded async
              // after mount, so alerts silently never fired.
              for (const alert of useConnectionStore.getState().alerts) {
                if (alert.device_key === device.key && alert.data_point === dp) {
                  setActiveAlertMessage(e.payload);
                }
              }
            })
          );
        }
      }
    }

    return () => {
      cancelled = true;
      unlisteners.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationSignature]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    // Hydrate the stores from a (devices, values) snapshot - used by both the
    // pull path (get_dashboard_data) and the backend push (dashboard-hydrated).
    // Display is driven by `values` (disk-seeded + MQTT-updated), so an empty
    // `devices` shape never blanks a widget that already has a cached value.
    const applyDashboardData = (
      devices: Record<string, DeviceData> | undefined,
      values: Record<string, string> | undefined
    ) => {
      if (cancelled) return;
      const deviceCount = devices ? Object.keys(devices).length : 0;
      const valueEntries = values ? Object.entries(values) : [];
      console.log(
        `[hydrate] applying ${deviceCount} device shapes, ${valueEntries.length} values`
      );

      // Only overwrite device shape when we actually have one, so a transient
      // empty fetch can't wipe a good shape that a previous fetch/push set.
      if (devices && deviceCount > 0) setDeviceData(devices);

      // Most entries are the JSON-wrapped shape the HTTP fetch returns
      // (`{id, value, key, createdAt}`, stringified) - but any datapoint touched
      // by a live MQTT update holds the raw, unwrapped payload (mqtt_service.rs
      // caches payloads as-is). Unwrap when wrapped; otherwise use the string
      // as-is. Always record a timestamp (falling back to now) so time-based
      // widgets (e.g. Timer) can render instead of hanging on "Loading...".
      const rawValues: Record<string, string> = {};
      const timestamps: Record<string, string> = {};
      const nowIso = new Date().toISOString();
      for (const [key, wrapped] of valueEntries) {
        try {
          const parsed = JSON.parse(wrapped);
          if (parsed && typeof parsed === "object" && "value" in parsed) {
            rawValues[key] = parsed.value;
            timestamps[key] = parsed.createdAt ?? nowIso;
          } else {
            rawValues[key] = wrapped;
            timestamps[key] = nowIso;
          }
        } catch (_) {
          rawValues[key] = wrapped;
          timestamps[key] = nowIso;
        }
      }
      setLastValues(rawValues);
      setLastValueTimestamps(timestamps);
    };

    const fetchDashboardData = (attempt = 0) => {
      if (retryTimer !== undefined) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }

      getDashboardData()
        .then(({ devices, values }) => {
          if (cancelled) return;
          applyDashboardData(devices, values);

          // `devices === null` (or an empty shape) means the backend fetch
          // hasn't succeeded yet - it failed with no disk cache (cold boot,
          // network not up). `applyDashboardData` already preserved any shape
          // we had; keep retrying so `connected` status and datapoint types
          // eventually resolve. The backend's own retry loop also pushes
          // `dashboard-hydrated` once it succeeds. Cached values are shown
          // regardless.
          const deviceCount = devices ? Object.keys(devices).length : 0;
          if (deviceCount === 0) {
            const delay = Math.min(2000 * 2 ** attempt, 30000);
            console.warn(
              `[hydrate] no device shape yet (attempt ${attempt}); retrying in ${delay}ms`
            );
            retryTimer = setTimeout(() => fetchDashboardData(attempt + 1), delay);
          }
        })
        .catch((err) => {
          console.error("[hydrate] get_dashboard_data failed:", err);
          if (cancelled) return;
          // Transient failures right after launch (network not up yet post
          // Windows-login autostart) - back off and retry instead of leaving the
          // dashboard blank until someone clicks "Refetch".
          const delay = Math.min(2000 * 2 ** attempt, 30000);
          retryTimer = setTimeout(() => fetchDashboardData(attempt + 1), delay);
        });
    };

    // Initial pull - one call instead of one `get_device` per device plus one
    // `get_last_value` per widget datapoint. Re-runs whenever the device/
    // datapoint set changes (hydrationSignature), since the backend invalidates
    // its cache on those saves and this refetch brings in the new shape/values.
    fetchDashboardData();

    // Backend push: fires whenever a fresh fetch succeeds (startup prefetch, the
    // background retry loop, or a command-triggered fetch). Primary safety net
    // against the UI staying stuck on stale/empty data - e.g. when the network
    // only comes up minutes after autostart.
    const hydratedUnlisten = listen<DashboardDataResult>("dashboard-hydrated", (e) => {
      if (cancelled || !e.payload) return;
      console.log("[hydrate] received dashboard-hydrated push");
      applyDashboardData(e.payload.devices, e.payload.values);
      if (retryTimer !== undefined) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }
    });

    // The taskbar's "Refetch" button clears the backend cache then emits this;
    // re-running the same fetch repopulates both stores from fresh data.
    const onRefetch = () => fetchDashboardData();
    emitter.on("refetch", onRefetch);
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
      hydratedUnlisten.then((fn) => fn());
      emitter.off("refetch", onRefetch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationSignature, setDeviceData, setLastValues, setLastValueTimestamps]);

  return null;
}
