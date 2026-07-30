import { useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";

import { useConnectionStore, DeviceData } from "../stores/connectionStore";
import { useDashboardStore } from "../stores/dashboardStore";
import {
  getDashboardData,
  requestDashboardRefresh,
  signalFrontendReady,
  DashboardDataResult,
} from "../api/dashboard";
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

  // Hydration runs ONCE, on mount, and is deliberately NOT keyed on
  // `hydrationSignature`.
  //
  // It used to be. That meant the effect tore itself down and re-ran the moment
  // `loadDashboard()` resolved (devices go []  ->  real list), so the first pull's
  // result was discarded via `cancelled` and a second identical call was queued
  // behind it. Combined with the backend doing its HTTP fetch inline behind a
  // shared mutex, that doubled the window in which the UI had no values at all.
  //
  // Nothing here needs the dashboard shape: value keys come from the payload
  // (`deviceKey---datapoint`), not from the widget list, so hydrating early is
  // free and always correct. Widgets that mount later just read the store.
  useEffect(() => {
    let cancelled = false;

    // Hydrate the stores from a (devices, values) snapshot - used by the initial
    // cache read, the `frontend_ready` handshake, and the `dashboard-hydrated`
    // push. Display is driven by `values` (disk-seeded + MQTT-updated), so an
    // empty `devices` shape never blanks a widget that already has a value.
    const applyDashboardData = (
      devices: Record<string, DeviceData> | null | undefined,
      values: Record<string, string> | undefined,
      source: string
    ) => {
      if (cancelled) return;
      const deviceCount = devices ? Object.keys(devices).length : 0;
      const valueEntries = values ? Object.entries(values) : [];
      console.log(
        `[hydrate] ${source}: applying ${deviceCount} device shapes, ${valueEntries.length} values`
      );

      // Only overwrite device shape when we actually have one, so a transient
      // empty snapshot can't wipe a good shape that a previous pass set.
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

    // Register the push listener BEFORE announcing readiness, so the snapshot
    // that `frontend_ready` triggers can't arrive before we're listening.
    const hydratedUnlisten = listen<DashboardDataResult>("dashboard-hydrated", (e) => {
      if (cancelled || !e.payload) return;
      applyDashboardData(e.payload.devices, e.payload.values, "push");
    });

    // Read the cache immediately. This is a pure memory read on the Rust side
    // (no HTTP, no lock), so it resolves in milliseconds regardless of the
    // network - widgets paint last-known-good readings essentially at once even
    // on a cold boot with the wifi still down.
    getDashboardData()
      .then(({ devices, values, fresh }) =>
        applyDashboardData(devices, values, `cache read (fresh=${fresh})`)
      )
      .catch((err) => console.error("[hydrate] get_dashboard_data failed:", err));

    // Then tell the backend we're listening. It replies with the same snapshot
    // AND re-emits `dashboard-hydrated`, so any push it made while the webview
    // was still loading (Tauri drops those silently) is recovered rather than
    // lost forever.
    hydratedUnlisten
      .then(() => signalFrontendReady())
      .then(({ devices, values }) => applyDashboardData(devices, values, "frontend_ready"))
      .catch((err) => console.error("[hydrate] frontend_ready failed:", err));

    // The taskbar's "Refetch" button. Ask the background refresher to go now;
    // the result comes back as a push. No fetch is ever awaited on this path.
    const onRefetch = () => {
      requestDashboardRefresh().catch((err) =>
        console.error("[hydrate] refresh request failed:", err)
      );
      getDashboardData()
        .then(({ devices, values }) => applyDashboardData(devices, values, "refetch"))
        .catch((err) => console.error("[hydrate] refetch cache read failed:", err));
    };
    emitter.on("refetch", onRefetch);

    return () => {
      cancelled = true;
      hydratedUnlisten.then((fn) => fn());
      emitter.off("refetch", onRefetch);
    };
    // Mount-only: the setters are stable Zustand actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adding/removing a device or widget changes which datapoints matter, so ask
  // the backend to refresh its shape. Fire-and-forget - the existing cache stays
  // on screen until the new snapshot is pushed. Skipped while the dashboard is
  // still empty (pre-`loadDashboard`), which would otherwise fire a pointless
  // refresh on every launch.
  useEffect(() => {
    if (dashboard.devices.length === 0) return;
    requestDashboardRefresh().catch((err) =>
      console.error("[hydrate] refresh request failed:", err)
    );
  }, [hydrationSignature, dashboard.devices.length]);

  return null;
}
