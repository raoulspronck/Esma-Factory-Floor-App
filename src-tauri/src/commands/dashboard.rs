use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::config::save_json;
use crate::error::AppError;
use crate::commands::misc::append_log;
use crate::models::dashboard::{Dashboard, Device, Layout, ValueResponse};
use crate::state::AppState;

#[derive(Deserialize)]
struct DashboardDataResponse {
    devices: serde_json::Value,
    values: Vec<ValueResponse>,
}

/// What `get_dashboard_data` hands back to the frontend: device shape data plus
/// a full snapshot of the last-value cache, so the UI can hydrate in one call
/// instead of each widget separately calling `get_last_value`.
#[derive(Serialize)]
pub struct DashboardDataOut {
    devices: serde_json::Value,
    values: HashMap<String, String>,
}

#[tauri::command(async)]
pub async fn get_dashboard(state: State<'_, AppState>) -> Result<String, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    let content = std::fs::read_to_string(&path).unwrap_or_else(|_| {
        serde_json::to_string_pretty(&Dashboard::default()).unwrap()
    });
    Ok(content)
}

#[tauri::command(async)]
pub async fn save_device_to_dashboard(
    device: Device,
    state: State<'_, AppState>,
) -> Result<Dashboard, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");

    let mut dashboard: Dashboard = std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    let layout = Layout {
        i: device.id.clone(),
        x: 0,
        y: 0,
        w: 1,
        h: 1,
    };

    dashboard.devices.push(device);
    dashboard.layout.push(layout);

    save_json(&path, &dashboard)?;
    Ok(dashboard)
}

#[tauri::command(async)]
pub async fn save_widget_to_dashboard(
    dashboard: Dashboard,
    state: State<'_, AppState>,
) -> Result<Dashboard, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    save_json(&path, &dashboard)?;
    Ok(dashboard)
}

#[tauri::command(async)]
pub async fn save_dashboard_layout(
    dashboard: Dashboard,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    save_json(&path, &dashboard)?;
    Ok("saved".into())
}

/// Fetches device shape (connected + datapoint definitions) and current values
/// for every datapoint referenced by the dashboard, in a single request, and
/// populates both in-memory caches. Replaces what used to be one `get_device`
/// call per device plus one `get_last_value` call per widget datapoint - all of
/// which fired concurrently on every dashboard mount and were spiking DB CPU.
async fn fetch_dashboard_data(state: &AppState) -> Result<serde_json::Value, AppError> {
    let path = state.settings_dir.join("dashboard.exalise.json");
    let dashboard: Dashboard = match std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
    {
        Some(d) => d,
        None => {
            append_log(state, "fetch_dashboard_data: dashboard.exalise.json not found or invalid");
            let empty = serde_json::json!({});
            *state.device_data.write().await = Some(empty.clone());
            return Ok(empty);
        }
    };

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

    let text = response.text().await.map_err(|e| {
        append_log(state, &format!("fetch_dashboard_data response read failed: {}", e));
        e
    })?;

    let parsed: DashboardDataResponse = serde_json::from_str(&text).map_err(|e| {
        append_log(
            state,
            &format!("fetch_dashboard_data JSON parse failed: {} / response: {}", e, text),
        );
        e
    })?;

    append_log(
        state,
        &format!(
            "fetch_dashboard_data: parsed {} values, {} devices",
            parsed.values.len(),
            parsed.devices.as_object().map(|o| o.len()).unwrap_or(0)
        ),
    );

    for v in parsed.values {
        state.update_last_value(&v.id_key, &v.value).await;
    }

    *state.device_data.write().await = Some(parsed.devices.clone());

    crate::services::cache_persist::flush_last_values(state).await;

    Ok(parsed.devices)
}

/// Kicks off `fetch_dashboard_data` in the background at startup, so it's
/// already cached by the time the dashboard mounts and calls `get_dashboard_data`.
/// Takes `dashboard_fetch_lock` itself - the frontend's webview loads
/// concurrently with this task (the splashscreen only hides the window, it
/// doesn't block JS execution), so `EventManager`'s mount-time
/// `get_dashboard_data` call routinely raced this one on a cold cache. Without
/// sharing the lock, both sides independently called `fetch_dashboard_data`,
/// firing two concurrent `POST /api/getdashboarddata` (and its 3 DB queries)
/// on every single app launch instead of one.
pub async fn prefetch_dashboard_data(state: &AppState) {
    let _guard = state.dashboard_fetch_lock.lock().await;
    if state.device_data.read().await.is_some() {
        return;
    }
    if let Err(e) = fetch_dashboard_data(state).await {
        append_log(state, &format!("prefetch_dashboard_data failed: {}", e));
    }
}

/// Returns cached device data (connected + datapoints) plus a snapshot of the
/// last-value cache, fetching first if nothing is cached yet. Concurrent
/// callers on a cold cache share one in-flight fetch instead of firing one
/// each - this single call replaces both the old one-`get_device`-per-device
/// fan-out and the one-`get_last_value`-per-widget fan-out.
#[tauri::command(async)]
pub async fn get_dashboard_data(state: State<'_, AppState>) -> Result<DashboardDataOut, AppError> {
    let devices = if let Some(data) = state.device_data.read().await.clone() {
        data
    } else {
        let _guard = state.dashboard_fetch_lock.lock().await;
        if let Some(data) = state.device_data.read().await.clone() {
            data
        } else {
            fetch_dashboard_data(&state).await?
        }
    };

    let values = state.last_values.read().await.clone();

    Ok(DashboardDataOut { devices, values })
}
