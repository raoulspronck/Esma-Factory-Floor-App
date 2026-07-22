use std::collections::{HashMap, HashSet};
use std::path::Path;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

use crate::config::save_json;
use crate::error::AppError;
use crate::commands::misc::append_log;
use crate::models::dashboard::{legacy, v2, Dashboard, Device, ValueResponse, Widget};
use crate::services::http::read_api_response;
use crate::state::AppState;

/// Each device owns a 2-column strip; max 5 strips per dashboard. Rows per
/// strip default to 7 (the frontend can show more/fewer via the
/// `dashboard_rows` basic setting) - migrations pack to this default.
const STRIP_COLS: i32 = 2;
const STRIP_ROWS: i32 = 7;
pub const MAX_DEVICES: usize = 5;

/// Reads `dashboard.exalise.json`, transparently migrating older formats:
/// v3 (per-device strips, `version` marker) is parsed natively; v2 (flat
/// 10-column grid with global widget coords, no `version`) and v1
/// (device-level `Layout` grid + `Widget.height` row budget) are migrated.
/// Every device/widget/datapoint is preserved - only geometry is recomputed,
/// since older layouts have no meaning inside a 2x8 device strip. The
/// migrated file is written back immediately so later reads take the fast
/// native-parse path.
pub fn load_dashboard(path: &Path) -> Dashboard {
    let Ok(content) = std::fs::read_to_string(path) else {
        return Dashboard::default();
    };

    // v3 requires the `version` field, so older files fall through.
    if let Ok(dashboard) = serde_json::from_str::<Dashboard>(&content) {
        return dashboard;
    }

    // v2 requires per-widget x/y/w/h, so v1 files fall through.
    if let Ok(old) = serde_json::from_str::<v2::Dashboard>(&content) {
        let migrated = migrate_v2_dashboard(old);
        let _ = save_json(path, &migrated);
        return migrated;
    }

    if let Ok(old) = serde_json::from_str::<legacy::Dashboard>(&content) {
        let migrated = migrate_legacy_dashboard(old);
        let _ = save_json(path, &migrated);
        return migrated;
    }

    Dashboard::default()
}

/// v1 widgets only ever carried a row-count `height`; approximate a sane
/// strip size from it. The "Two Default/…" composite type laid two stats out
/// side by side, so it maps to a full-strip-width 2x1 cell; the old
/// `height >= 3` circular-progress budget maps to 2x2.
fn legacy_widget_size(name: &str, height: u32) -> (i32, i32) {
    if name.starts_with("Two Default") {
        (2, 1)
    } else if height >= 3 {
        (2, 2)
    } else {
        (1, 1)
    }
}

/// First-fit scan for a free `w`x`h` rect, row-major from (0,0), within a
/// grid `cols` wide. Rows are unbounded here - callers that must fit a strip
/// handle overflow themselves (see `pack_strip`).
fn find_free_slot(placed: &[(i32, i32, i32, i32)], w: i32, h: i32, cols: i32) -> (i32, i32) {
    let mut y = 0;
    loop {
        let mut x = 0;
        while x + w <= cols {
            let collides = placed.iter().any(|&(px, py, pw, ph)| {
                x < px + pw && x + w > px && y < py + ph && y + h > py
            });
            if !collides {
                return (x, y);
            }
            x += 1;
        }
        y += 1;
    }
}

/// Packs `sizes` (w, h) in order into a 2-column strip. If the packed result
/// is taller than the strip's 8 rows, every height is scaled down
/// proportionally (min 1) and packed again so the strip fits - a migration
/// must produce a layout the user can actually see and rearrange, not one
/// clipped behind overflow:hidden. Only a device with more than 16 unit
/// cells can still overflow, in which case the tail is left below row 8.
fn pack_strip(sizes: &[(i32, i32)]) -> Vec<(i32, i32, i32, i32)> {
    let place = |sizes: &[(i32, i32)]| -> Vec<(i32, i32, i32, i32)> {
        let mut placed: Vec<(i32, i32, i32, i32)> = vec![];
        for &(w, h) in sizes {
            let (x, y) = find_free_slot(&placed, w, h, STRIP_COLS);
            placed.push((x, y, w, h));
        }
        placed
    };

    let first = place(sizes);
    let needed = first.iter().map(|&(_, y, _, h)| y + h).max().unwrap_or(0);
    if needed <= STRIP_ROWS {
        return first;
    }

    let scaled: Vec<(i32, i32)> = sizes
        .iter()
        .map(|&(w, h)| (w, ((h * STRIP_ROWS) / needed).max(1)))
        .collect();
    place(&scaled)
}

/// Shared tail of both migrations: given each widget's target (w, h), pack
/// them into the device's strip and stamp the resulting local coordinates.
fn pack_device_widgets<W, F>(widgets: Vec<W>, size_of: F) -> Vec<Widget>
where
    F: Fn(&W) -> (i32, i32),
    W: Into<Widget>,
{
    let sizes: Vec<(i32, i32)> = widgets.iter().map(&size_of).collect();
    let rects = pack_strip(&sizes);
    widgets
        .into_iter()
        .zip(rects)
        .map(|(w, (x, y, width, height))| {
            let mut widget: Widget = w.into();
            widget.x = x;
            widget.y = y;
            widget.w = width;
            widget.h = height;
            widget
        })
        .collect()
}

impl From<v2::Widget> for Widget {
    fn from(w: v2::Widget) -> Widget {
        Widget {
            id: w.id,
            name: w.name,
            x: 0,
            y: 0,
            w: w.w,
            h: w.h,
            datapoints: w.datapoints,
        }
    }
}

impl From<legacy::Widget> for Widget {
    fn from(w: legacy::Widget) -> Widget {
        Widget {
            id: w.id,
            name: w.name,
            x: 0,
            y: 0,
            w: 1,
            h: 1,
            datapoints: w.datapoints,
        }
    }
}

/// v2 -> v3: widgets kept in their visual order (sorted by global y then x),
/// widths/heights clamped to what a 2x8 strip can hold, then packed.
fn migrate_v2_dashboard(old: v2::Dashboard) -> Dashboard {
    let devices = old
        .devices
        .into_iter()
        .map(|d| {
            let mut widgets = d.widgets;
            widgets.sort_by_key(|w| (w.y, w.x));
            let packed = pack_device_widgets(widgets, |w| {
                (w.w.clamp(1, STRIP_COLS), w.h.clamp(1, STRIP_ROWS))
            });

            Device {
                id: d.id,
                name: d.name,
                key: d.key,
                widgets: packed,
            }
        })
        .collect();

    Dashboard {
        version: 3,
        devices,
    }
}

fn migrate_legacy_dashboard(old: legacy::Dashboard) -> Dashboard {
    let devices = old
        .devices
        .into_iter()
        .map(|d| {
            let packed =
                pack_device_widgets(d.widgets, |w| legacy_widget_size(&w.name, w.height));

            Device {
                id: d.id,
                name: d.name,
                key: d.key,
                widgets: packed,
            }
        })
        .collect();

    Dashboard {
        version: 3,
        devices,
    }
}

/// The set of device keys this installation actually owns, given a dashboard's
/// devices and the kiosk's own master device key. See `AppState::known_device_keys`.
pub fn known_keys_from_dashboard(dashboard: &Dashboard, master_device_key: &str) -> HashSet<String> {
    let mut keys: HashSet<String> = dashboard.devices.iter().map(|d| d.key.clone()).collect();
    keys.insert(master_device_key.to_string());
    keys
}

/// Reads `dashboard.exalise.json` from disk and derives `known_device_keys` from
/// it - used at startup, before `AppState` exists to hold an in-memory `Dashboard`.
pub fn compute_known_device_keys(settings_dir: &std::path::Path, master_device_key: &str) -> HashSet<String> {
    let path = settings_dir.join("dashboard.exalise.json");
    let dashboard = load_dashboard(&path);
    known_keys_from_dashboard(&dashboard, master_device_key)
}

async fn refresh_known_device_keys(dashboard: &Dashboard, state: &AppState) {
    let master_device_key = state.config.read().await.exalise.mqtt_settings.device_key.clone();
    *state.known_device_keys.write().await = known_keys_from_dashboard(dashboard, &master_device_key);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn overlaps(a: (i32, i32, i32, i32), b: (i32, i32, i32, i32)) -> bool {
        a.0 < b.0 + b.2 && a.0 + a.2 > b.0 && a.1 < b.1 + b.3 && a.1 + a.3 > b.1
    }

    fn assert_strip_valid(device: &Device) {
        let rects: Vec<(i32, i32, i32, i32)> =
            device.widgets.iter().map(|w| (w.x, w.y, w.w, w.h)).collect();
        for i in 0..rects.len() {
            for j in (i + 1)..rects.len() {
                assert!(
                    !overlaps(rects[i], rects[j]),
                    "device {}: widgets {} and {} overlap",
                    device.name,
                    i,
                    j
                );
            }
            let (x, y, w, h) = rects[i];
            assert!(x >= 0 && x + w <= STRIP_COLS, "widget exceeds strip width");
            assert!(y >= 0 && y + h <= STRIP_ROWS, "widget exceeds strip height");
        }
    }

    #[test]
    fn migrate_v1_packs_each_device_into_its_strip() {
        let old = legacy::Dashboard {
            devices: vec![legacy::Device {
                id: "d1".into(),
                name: "Lathe #2".into(),
                key: "lathe-2".into(),
                widgets: vec![
                    legacy::Widget {
                        id: "w1".into(),
                        name: "Default".into(),
                        height: 1,
                        datapoints: vec!["rpm".into()],
                    },
                    legacy::Widget {
                        id: "w2".into(),
                        name: "Circular progress".into(),
                        height: 3,
                        datapoints: vec!["progress".into()],
                    },
                    legacy::Widget {
                        id: "w3".into(),
                        name: "Two Default/Default/Default".into(),
                        height: 1,
                        datapoints: vec!["a".into(), "b".into()],
                    },
                ],
            }],
        };

        let migrated = migrate_legacy_dashboard(old);

        assert_eq!(migrated.version, 3);
        assert_eq!(migrated.devices.len(), 1);
        let device = &migrated.devices[0];
        assert_eq!(device.id, "d1");
        assert_eq!(device.widgets.len(), 3);

        let by_id = |id: &str| device.widgets.iter().find(|w| w.id == id).unwrap();
        assert_eq!(by_id("w1").datapoints, vec!["rpm".to_string()]);
        let w1 = by_id("w1");
        assert_eq!((w1.x, w1.y, w1.w, w1.h), (0, 0, 1, 1));
        let w2 = by_id("w2");
        assert_eq!((w2.x, w2.y, w2.w, w2.h), (0, 1, 2, 2));
        let w3 = by_id("w3");
        assert_eq!((w3.x, w3.y, w3.w, w3.h), (0, 3, 2, 1));

        assert_strip_valid(device);
    }

    /// Mirrors the real pre-v3 `dashboard.exalise.json` (flat 10-col global
    /// coords, including a device whose stacked heights exceed the 8-row
    /// strip and must be squashed to fit).
    #[test]
    fn migrate_v2_fits_every_device_into_a_strip() {
        let json = r#"{
          "devices": [
            {
              "id": "dev-robot", "name": "Robot pinmachine", "key": "key-robot",
              "widgets": [
                { "id": "r1", "name": "Two Default/Time prediction/Time prediction", "x": 0, "y": 3, "w": 2, "h": 1, "datapoints": ["Min-order-time", "Avg-order-time"] },
                { "id": "r2", "name": "Two Default/Default/Default", "x": 2, "y": 4, "w": 3, "h": 4, "datapoints": ["Min-order-time", "Avg-order-time"] },
                { "id": "r3", "name": "Two Default/Default/Default", "x": 0, "y": 4, "w": 2, "h": 4, "datapoints": ["Run-time", "Z-maat"] },
                { "id": "r4", "name": "Circular progress with variable color", "x": 0, "y": 8, "w": 2, "h": 4, "datapoints": ["Pinasjes-gemaakt", "Pinasjes-te-maken", "Lamp"] }
              ]
            },
            {
              "id": "dev-v80", "name": "V-80", "key": "key-v80",
              "widgets": [
                { "id": "a1", "name": "Default", "x": 8, "y": 0, "w": 1, "h": 1, "datapoints": ["ORDER"] },
                { "id": "a2", "name": "Two Default/Time prediction/Time prediction", "x": 0, "y": 1, "w": 2, "h": 1, "datapoints": ["Min-order-time", "Avg-order-time"] },
                { "id": "a3", "name": "Two Default/Default/Default", "x": 2, "y": 1, "w": 2, "h": 1, "datapoints": ["Min-order-time", "Avg-order-time"] },
                { "id": "a4", "name": "Default", "x": 9, "y": 0, "w": 1, "h": 1, "datapoints": ["Run-stop-time"] },
                { "id": "a5", "name": "Two Default/Default/Default", "x": 4, "y": 1, "w": 2, "h": 1, "datapoints": ["PARTS", "TOOL"] },
                { "id": "a6", "name": "Timer", "x": 8, "y": 1, "w": 1, "h": 1, "datapoints": ["STATUS"] },
                { "id": "a7", "name": "Custom input", "x": 9, "y": 1, "w": 1, "h": 1, "datapoints": ["Parts-to-make"] }
              ]
            }
          ]
        }"#;

        let old: v2::Dashboard = serde_json::from_str(json).unwrap();
        let migrated = migrate_v2_dashboard(old);

        assert_eq!(migrated.version, 3);
        assert_eq!(migrated.devices.len(), 2);

        // Device 1: stacked heights were 1+4+4+4 = 13 rows -> squashed to fit.
        let robot = &migrated.devices[0];
        assert_eq!(robot.widgets.len(), 4);
        let by_id = |d: &Device, id: &str| {
            let w = d.widgets.iter().find(|w| w.id == id).unwrap().clone();
            (w.x, w.y, w.w, w.h)
        };
        assert_eq!(by_id(robot, "r1"), (0, 0, 2, 1));
        assert_eq!(by_id(robot, "r3"), (0, 1, 2, 2));
        assert_eq!(by_id(robot, "r2"), (0, 3, 2, 2));
        assert_eq!(by_id(robot, "r4"), (0, 5, 2, 2));
        assert_strip_valid(robot);

        // Device 2: all 1-row widgets, visual order preserved (y, then x).
        let v80 = &migrated.devices[1];
        assert_eq!(by_id(v80, "a1"), (0, 0, 1, 1));
        assert_eq!(by_id(v80, "a4"), (1, 0, 1, 1));
        assert_eq!(by_id(v80, "a2"), (0, 1, 2, 1));
        assert_eq!(by_id(v80, "a3"), (0, 2, 2, 1));
        assert_eq!(by_id(v80, "a5"), (0, 3, 2, 1));
        assert_eq!(by_id(v80, "a6"), (0, 4, 1, 1));
        assert_eq!(by_id(v80, "a7"), (1, 4, 1, 1));
        assert_strip_valid(v80);

        // Datapoints survive untouched.
        let r4 = robot.widgets.iter().find(|w| w.id == "r4").unwrap();
        assert_eq!(
            r4.datapoints,
            vec!["Pinasjes-gemaakt".to_string(), "Pinasjes-te-maken".to_string(), "Lamp".to_string()]
        );
    }
}

#[derive(Deserialize)]
struct DashboardDataResponse {
    devices: serde_json::Value,
    values: Vec<ValueResponse>,
}

/// What `get_dashboard_data` hands back to the frontend: device shape data plus
/// a full snapshot of the last-value cache, so the UI can hydrate in one call
/// instead of each widget separately calling `get_last_value`.
///
/// `devices` is `None` (JSON `null`) when the upstream fetch failed and no
/// cached snapshot exists - distinct from `{}` (a genuinely empty dashboard).
/// The frontend keeps its current device shapes and retries on `null`; the
/// old behavior of returning `{}` on failure silently wiped every widget's
/// datapoint definitions and defeated the frontend's retry logic.
#[derive(Serialize)]
pub struct DashboardDataOut {
    devices: Option<serde_json::Value>,
    values: HashMap<String, String>,
}

#[tauri::command(async)]
pub async fn get_dashboard(state: State<'_, AppState>) -> Result<String, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    let dashboard = load_dashboard(&path);
    Ok(serde_json::to_string_pretty(&dashboard).unwrap())
}

#[tauri::command(async)]
pub async fn save_device_to_dashboard(
    device: Device,
    state: State<'_, AppState>,
) -> Result<Dashboard, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");

    let mut dashboard = load_dashboard(&path);
    if dashboard.devices.len() >= MAX_DEVICES {
        return Err(AppError::Other(format!(
            "Dashboard is full (max {} devices)",
            MAX_DEVICES
        )));
    }
    dashboard.devices.push(device);

    save_json(&path, &dashboard)?;
    refresh_known_device_keys(&dashboard, &state).await;
    // The cached device_data snapshot predates this device - drop it so the
    // next get_dashboard_data fetches the new device's shape/datapoints
    // instead of serving a stale cache that doesn't know the device exists.
    *state.device_data.write().await = None;
    Ok(dashboard)
}

#[tauri::command(async)]
pub async fn save_widget_to_dashboard(
    dashboard: Dashboard,
    state: State<'_, AppState>,
) -> Result<Dashboard, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    save_json(&path, &dashboard)?;
    refresh_known_device_keys(&dashboard, &state).await;
    // A new widget may reference datapoints whose latest value isn't cached
    // yet - invalidate so the next get_dashboard_data fetches them.
    *state.device_data.write().await = None;
    Ok(dashboard)
}

#[tauri::command(async)]
pub async fn save_dashboard_layout(
    dashboard: Dashboard,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    save_json(&path, &dashboard)?;
    refresh_known_device_keys(&dashboard, &state).await;
    Ok("saved".into())
}

/// Fetches device shape (connected + datapoint definitions) and current values
/// for every datapoint referenced by the dashboard, in a single request, and
/// populates both in-memory caches. Replaces what used to be one `get_device`
/// call per device plus one `get_last_value` call per widget datapoint - all of
/// which fired concurrently on every dashboard mount and were spiking DB CPU.
async fn fetch_dashboard_data(
    state: &AppState,
    app_handle: &AppHandle,
) -> Result<serde_json::Value, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    let dashboard = load_dashboard(&path);
    if !path.exists() {
        append_log(state, "fetch_dashboard_data: dashboard.exalise.json not found or invalid");
        let empty = serde_json::json!({});
        *state.device_data.write().await = Some(empty.clone());
        return Ok(empty);
    }

    append_log(
        state,
        &format!(
            "fetch_dashboard_data: dashboard loaded with {} devices",
            dashboard.devices.len()
        ),
    );

    let (http_key, http_secret, device_key) = {
        let config = state.config.read().await;
        (
            config.exalise.http_settings.http_key.clone(),
            config.exalise.http_settings.http_secret.clone(),
            config.exalise.mqtt_settings.device_key.clone(),
        )
    };

    let response = state
        .http_client
        .post("https://api.exalise.com/api/getdashboarddata")
        .header("x-api-key", &http_key)
        .header("x-api-secret", &http_secret)
        .header("x-master-device-key", &device_key)
        .json(&dashboard.devices)
        .send()
        .await
        .map_err(|e| {
            append_log(state, &format!("fetch_dashboard_data HTTP request failed: {}", e));
            e
        })?;

    let status = response.status();
    append_log(state, &format!("fetch_dashboard_data: HTTP status {}", status));

    // read_api_response turns any non-2xx into AppError::Api(status, body) so an
    // error body never reaches the JSON parser as if it were data.
    let text = read_api_response(response).await.map_err(|e| {
        append_log(state, &format!("fetch_dashboard_data failed: {}", e));
        e
    })?;

    append_log(state, &format!("fetch_dashboard_data: response body {} chars", text.len()));

    // The API answers server-side failures with HTTP 200 and a bare string body
    // (`"Error"` / `"UNAUTHENTICATED"`) rather than an error status, so without
    // this an auth/DB problem would surface only as a confusing JSON parse error.
    let trimmed = text.trim();
    if trimmed == "Error" || trimmed == "UNAUTHENTICATED" || trimmed.is_empty() {
        append_log(
            state,
            &format!("fetch_dashboard_data: server returned non-data body '{}' (status {})", trimmed, status),
        );
        return Err(AppError::Other(format!(
            "getdashboarddata returned '{}' (status {})",
            trimmed, status
        )));
    }

    let parsed: DashboardDataResponse = serde_json::from_str(&text).map_err(|e| {
        append_log(
            state,
            &format!("fetch_dashboard_data JSON parse failed: {} / response: {}", e, text),
        );
        e
    })?;

    let device_count = parsed.devices.as_object().map(|o| o.len()).unwrap_or(0);
    append_log(
        state,
        &format!(
            "fetch_dashboard_data: parsed {} values, {} devices",
            parsed.values.len(),
            device_count
        ),
    );

    // Per-device datapoint counts make "widget stuck loading" diagnosable from
    // the log alone: a widget referencing a datapoint the device shape doesn't
    // define is the classic cause, and it shows up here as a low/zero count.
    match parsed.devices.as_object() {
        Some(obj) => {
            for (id, shape) in obj {
                let dp_count = shape
                    .get("dataPoint")
                    .and_then(|d| d.as_array())
                    .map(|a| a.len())
                    .unwrap_or(0);
                let connected = shape.get("connected").and_then(|c| c.as_bool());
                append_log(
                    state,
                    &format!(
                        "fetch_dashboard_data: device {} -> {} datapoints, connected={:?}",
                        id, dp_count, connected
                    ),
                );
            }
        }
        None => {
            append_log(state, "fetch_dashboard_data: WARNING devices payload is not a JSON object");
        }
    }

    if parsed.values.is_empty() {
        append_log(
            state,
            "fetch_dashboard_data: WARNING parsed 0 values - HTTP-only widgets (no live MQTT) will show 'No data'",
        );
    }

    for v in parsed.values {
        state.update_last_value(&v.id_key, &v.value).await;
    }

    *state.device_data.write().await = Some(parsed.devices.clone());

    crate::services::cache_persist::flush_last_values(state).await;
    crate::services::cache_persist::flush_device_data(state).await;

    // Push the fresh snapshot to the frontend. The frontend also pulls once on
    // mount, but that call can race this fetch (or hit the disk-fallback path);
    // this event guarantees the UI hydrates the moment real data is available,
    // including when a background retry finally succeeds minutes after launch.
    emit_hydration(state, app_handle, &parsed.devices).await;

    Ok(parsed.devices)
}

/// Emits `dashboard-hydrated` to the main window with the current device shape
/// plus a snapshot of the last-value cache, so the frontend can (re)hydrate
/// from a push rather than depending solely on its own `get_dashboard_data`.
async fn emit_hydration(state: &AppState, app_handle: &AppHandle, devices: &serde_json::Value) {
    let values = state.last_values.read().await.clone();
    let value_count = values.len();
    let payload = DashboardDataOut {
        devices: Some(devices.clone()),
        values,
    };
    match app_handle.get_window("main") {
        Some(win) => match win.emit("dashboard-hydrated", &payload) {
            Ok(_) => append_log(
                state,
                &format!("emit_hydration: pushed dashboard-hydrated ({} values)", value_count),
            ),
            Err(e) => append_log(state, &format!("emit_hydration: emit failed: {}", e)),
        },
        None => append_log(state, "emit_hydration: main window not found; push skipped"),
    };
}

/// One prefetch attempt, guarded by `dashboard_fetch_lock` so it can't race a
/// concurrent frontend `get_dashboard_data` into two duplicate POSTs. Returns
/// whether device shape is now populated (i.e. whether a retry is still needed).
/// The lock is released as soon as the attempt returns, so the retry loop's
/// backoff sleep never blocks a waiting frontend caller.
pub async fn prefetch_dashboard_data(state: &AppState, app_handle: &AppHandle) -> bool {
    let _guard = state.dashboard_fetch_lock.lock().await;
    if state.device_data.read().await.is_some() {
        return true;
    }
    match fetch_dashboard_data(state, app_handle).await {
        Ok(_) => true,
        Err(e) => {
            append_log(state, &format!("prefetch_dashboard_data attempt failed: {}", e));
            false
        }
    }
}

/// Returns cached device data (connected + datapoints) plus a snapshot of the
/// last-value cache, fetching first if nothing is cached yet. Concurrent
/// callers on a cold cache share one in-flight fetch instead of firing one each.
///
/// A failed fetch never propagates as an error here, so a transient HTTP failure
/// (e.g. network not up yet right after Windows-login autostart) can't blank the
/// dashboard. It first falls back to the last device shape persisted to disk
/// (`device_data.cache.json`) so widget types still resolve on a cold start; if
/// there's no disk cache either, `devices` comes back as `null`, telling the
/// frontend to keep what it has and retry later (see `DashboardDataOut`). Either
/// way `values` come from the disk-seeded, MQTT-updated `last_values`, and the
/// background retry loop fetches fresh data and pushes it via `dashboard-hydrated`.
#[tauri::command(async)]
pub async fn get_dashboard_data(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<DashboardDataOut, AppError> {
    let devices = if let Some(data) = state.device_data.read().await.clone() {
        Some(data)
    } else {
        let _guard = state.dashboard_fetch_lock.lock().await;
        if let Some(data) = state.device_data.read().await.clone() {
            Some(data)
        } else {
            match fetch_dashboard_data(&state, &app_handle).await {
                Ok(data) => Some(data),
                Err(e) => {
                    // Prefer the last device shape persisted to disk so widget
                    // types still resolve on a cold start; if there's no disk
                    // cache either, return None so the frontend keeps whatever it
                    // has and the background retry loop (which pushes
                    // `dashboard-hydrated`) fills it in.
                    let disk = std::fs::read_to_string(
                        crate::services::cache_persist::device_data_cache_path(&state),
                    )
                    .ok()
                    .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok());
                    match disk {
                        Some(d) => {
                            append_log(
                                &state,
                                &format!("get_dashboard_data: fetch failed ({}); using device shape from disk cache", e),
                            );
                            Some(d)
                        }
                        None => {
                            append_log(
                                &state,
                                &format!("get_dashboard_data: fetch failed ({}) and no disk device cache; returning devices=null", e),
                            );
                            None
                        }
                    }
                }
            }
        }
    };

    let values = state.last_values.read().await.clone();
    append_log(
        &state,
        &format!(
            "get_dashboard_data: returning {} device shapes, {} values",
            devices.as_ref().and_then(|d| d.as_object()).map(|o| o.len()).unwrap_or(0),
            values.len()
        ),
    );

    Ok(DashboardDataOut { devices, values })
}
