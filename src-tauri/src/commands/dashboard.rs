use tauri::State;

use crate::config::save_json;
use crate::error::AppError;
use crate::models::dashboard::{Dashboard, Device, Layout, ValueResponse};
use crate::state::AppState;

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

/// Fetches current values for all datapoints in the dashboard from the Exalise API
/// and populates the in-memory last-value cache. Called once at startup.
pub async fn initialize_last_values(state: &AppState) {
    let path = state.settings_dir.join("dashboard.exalise.json");
    let dashboard: Dashboard = match std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
    {
        Some(d) => d,
        None => return,
    };

    let config = state.config.read().await;
    let device_key = &config.exalise.mqtt_settings.device_key;
    let http_key = &config.exalise.http_settings.http_key;
    let http_secret = &config.exalise.http_settings.http_secret;

    let response = state
        .http_client
        .get("https://api.exalise.com/api/getvaluesfromcustomdashboard")
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .json(&dashboard.devices)
        .send()
        .await;

    if let Ok(resp) = response {
        if let Ok(text) = resp.text().await {
            if let Ok(values) = serde_json::from_str::<Vec<ValueResponse>>(&text) {
                for v in values {
                    state.update_last_value(&v.id_key, &v.value).await;
                }
            }
        }
    }
}
