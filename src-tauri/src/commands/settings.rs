use tauri::State;

use crate::config::save_json;
use crate::error::AppError;
use crate::models::alerts::{Alert, Alerts};
use crate::models::settings::{ApiSettings, BasicSettings, ExaliseHttpSettings, ExaliseMqttSettings, RS232Settings};
use crate::state::AppState;

// ── Exalise settings ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_exalise_settings(state: State<'_, AppState>) -> Result<String, AppError> {
    let path = state.settings_dir.join("settings.exalise.json");
    Ok(std::fs::read_to_string(&path).unwrap_or_else(|_| "{}".into()))
}

#[tauri::command(async)]
pub async fn save_exalise_mqtt_settings(
    mqtt_key: String,
    mqtt_secret: String,
    device_key: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("settings.exalise.json");
    let mut config = state.config.write().await;
    config.exalise.mqtt_settings = ExaliseMqttSettings { mqtt_key, mqtt_secret, device_key };
    save_json(&path, &config.exalise)?;
    Ok("Saved".into())
}

#[tauri::command(async)]
pub async fn save_exalise_http_settings(
    http_key: String,
    http_secret: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("settings.exalise.json");
    let mut config = state.config.write().await;
    config.exalise.http_settings = ExaliseHttpSettings { http_key, http_secret };
    save_json(&path, &config.exalise)?;
    Ok("Saved".into())
}

#[tauri::command(async)]
pub async fn save_rs232_settings(
    port_name: String,
    baud_rate: u32,
    data_bits_number: u32,
    parity_string: u32,
    stop_bits_number: u32,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    if port_name.is_empty() {
        return Err("No port name specified".into());
    }
    if baud_rate == 0 {
        return Err("No baud rate specified".into());
    }
    if !matches!(data_bits_number, 5 | 6 | 7 | 8) {
        return Err("Invalid data bits value".into());
    }
    if !matches!(parity_string, 0 | 1 | 2) {
        return Err("Invalid parity value".into());
    }
    if !matches!(stop_bits_number, 1 | 2) {
        return Err("Invalid stop bits value".into());
    }

    let path = state.settings_dir.join("settings.exalise.json");
    let mut config = state.config.write().await;
    config.exalise.rs232_settings = RS232Settings {
        port_name,
        baud_rate,
        data_bits_number,
        parity_string,
        stop_bits_number,
    };
    save_json(&path, &config.exalise)?;
    Ok("Saved".into())
}

// ── API settings ──────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_api_settings(state: State<'_, AppState>) -> Result<String, AppError> {
    let path = state.settings_dir.join("api.settings.json");
    Ok(std::fs::read_to_string(&path).unwrap_or_else(|_| "{}".into()))
}

#[tauri::command(async)]
pub async fn save_api_settings(
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("api.settings.json");
    let mut config = state.config.write().await;
    config.api = ApiSettings { username, password };
    save_json(&path, &config.api)?;
    Ok("Saved".into())
}

// ── Basic settings ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_basic_settings(state: State<'_, AppState>) -> Result<String, AppError> {
    let path = state.settings_dir.join("basic.settings.json");
    Ok(std::fs::read_to_string(&path).unwrap_or_else(|_| "{}".into()))
}

#[tauri::command(async)]
pub async fn save_basic_settings(
    gesture: String,
    dashboard: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("basic.settings.json");
    let mut config = state.config.write().await;
    config.basic = BasicSettings {
        gesture_control: gesture,
        automatic_load_dashboard: dashboard,
    };
    save_json(&path, &config.basic)?;
    Ok("Saved".into())
}

// ── Alerts ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_alerts(state: State<'_, AppState>) -> Result<String, AppError> {
    let path = state.settings_dir.join("alerts.exalise.json");
    Ok(std::fs::read_to_string(&path).unwrap_or_else(|_| r#"{"alerts":[]}"#.into()))
}

#[tauri::command(async)]
pub async fn save_alerts(
    alert_items: Vec<Alert>,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let path = state.settings_dir.join("alerts.exalise.json");
    save_json(&path, &Alerts { alerts: alert_items })?;
    Ok("Saved".into())
}
