use chrono::prelude::*;
use serde::Serialize;
use serde_json::Value;
use std::fs::OpenOptions;
use std::io::Write;
use tauri::{AppHandle, Manager, State};

use crate::error::AppError;
use crate::models::settings::{Debiteur, LoginData};
use crate::services::http::read_api_response;
use crate::state::AppState;

fn try_append(path: &std::path::Path, line: &str) -> bool {
    OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .and_then(|mut f| f.write_all(line.as_bytes()))
        .is_ok()
}

/// Payload for the `"app-log"` event — the single stream the frontend's "App
/// Logs" viewer (both its live tab and its log-file tab) renders. Kept
/// structured (rather than one opaque string) so the frontend can color-code
/// by category instead of parsing free text.
#[derive(Clone, Serialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub category: String,
    pub message: String,
}

/// Writes one line to `logs.txt` and emits it live to the frontend, so the
/// on-screen log and the file are always the same data - there is
/// deliberately no other way to add a line to either. Callers pick a
/// `category` ("system" | "dashboard" | "device" | "mqtt") so the UI can
/// color-code entries without parsing message text.
pub fn log_event(state: &AppState, app_handle: &AppHandle, category: &str, message: &str) -> bool {
    let timestamp = Local::now().format("%d-%m-%Y %H:%M:%S").to_string();
    let line = format!("{} - [{}] {}\n", timestamp, category, message);

    // Prefer the settings dir (where logs have always lived, alongside the
    // deployment-managed config). If that write fails - e.g. a kiosk whose
    // Windows user can't write the hardcoded settings path - fall back to the
    // always-writable per-user app data dir. Without this, log lines silently
    // vanished on those machines, which looked like "no errors in the logs"
    // while nothing was actually being recorded.
    let written = if try_append(&state.settings_dir.join("logs.txt"), &line) {
        true
    } else {
        try_append(&state.app_data_dir.join("logs.txt"), &line)
    };

    let _ = app_handle.emit_all(
        "app-log",
        LogEntry {
            timestamp,
            category: category.to_string(),
            message: message.to_string(),
        },
    );

    written
}

/// Reads the full contents of `logs.txt` (settings dir, falling back to the
/// app-data dir), already bounded to the last 30 days by the periodic
/// pruning in `services::log_retention`.
#[tauri::command]
pub fn read_log_file(state: State<'_, AppState>) -> Result<String, AppError> {
    let content = std::fs::read_to_string(state.settings_dir.join("logs.txt"))
        .or_else(|_| std::fs::read_to_string(state.app_data_dir.join("logs.txt")))
        .unwrap_or_default();
    Ok(content)
}

#[tauri::command(async)]
pub async fn close_splashscreen(window: tauri::Window) {
    if let Some(splash) = window.get_window("splashscreen") {
        let _ = splash.close();
    }
    if let Some(main) = window.get_window("main") {
        let _ = main.show();
    }

    // The frontend only calls this command after loadDashboard/loadSettings
    // resolve - by which point EventManager (mounted synchronously, before
    // those async calls even finish) is guaranteed to already be subscribed
    // to Tauri events. Running the day-off check from here instead of a fixed
    // delay after setup() means a resulting "shutdown-requested" emit can
    // never be dropped by a frontend that isn't listening yet - previously,
    // on a slow boot (e.g. yarn dev re-optimizing Vite deps), the 500ms delay
    // could fire before EventManager subscribed: the backend's own shutdown
    // timer still ran on schedule, but the dialog never appeared.
    let app_handle = window.app_handle();
    tauri::async_runtime::spawn(async move {
        let state = app_handle.state::<AppState>();
        let (http_key, http_secret, device_key) = {
            let config = state.config.read().await;
            (
                config.exalise.http_settings.http_key.clone(),
                config.exalise.http_settings.http_secret.clone(),
                config.exalise.mqtt_settings.device_key.clone(),
            )
        };
        crate::services::mqtt_service::check_day_off(
            &state.http_client,
            &http_key,
            &http_secret,
            &device_key,
            app_handle.clone(),
        )
        .await;
    });
}

#[tauri::command]
pub fn get_pdf_file() -> Result<String, AppError> {
    Ok("Ok".into())
}

#[tauri::command]
pub fn write_to_log_file(data: String, state: State<'_, AppState>, app_handle: AppHandle) -> bool {
    log_event(&state, &app_handle, "system", &data)
}

// ── ESMA API (debiteuren) ──────────────────────────────────────────────────────

async fn fetch_bearer_token(
    http_client: &reqwest::Client,
    username: &str,
    password: &str,
) -> Option<String> {
    let data = serde_urlencoded::to_string(&LoginData {
        grant_type: "password".into(),
        username: username.into(),
        password: password.into(),
    })
    .ok()?;

    let resp = http_client
        .post("https://app.esma.be:4430/Token")
        .header("Accept", "*/*")
        .header("X-Requested-With", "XMLHttpRequest")
        .header("Referer", "https://app.esma.be:4430/")
        .body(data)
        .send()
        .await
        .ok()?
        .text()
        .await
        .ok()?;

    let v: Value = serde_json::from_str(&resp).ok()?;
    v.get("access_token")?.as_str().map(|s| s.to_string())
}

async fn fetch_debiteuren_list(
    esma_client: &reqwest::Client,
    token: &str,
) -> Result<reqwest::Response, reqwest::Error> {
    esma_client
        .get("https://app.esma.be:4430/api/Debiteur")
        .header("Accept", "*/*")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
}

#[tauri::command(async)]
pub async fn get_debiteuren(
    take: usize,
    skip: usize,
    _productie_order: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let (username, password) = {
        let config = state.config.read().await;
        (config.api.username.clone(), config.api.password.clone())
    };

    // ESMA API requires accepting invalid certs.
    let esma_client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(AppError::Http)?;

    let token = fetch_bearer_token(&esma_client, &username, &password)
        .await
        .ok_or_else(|| AppError::Other("Access denied".into()))?;

    let resp = fetch_debiteuren_list(&esma_client, &token).await?;
    let status = resp.status();

    let text = if status == 200 {
        resp.text().await?
    } else if status == 401 {
        let new_token = fetch_bearer_token(&esma_client, &username, &password)
            .await
            .ok_or_else(|| AppError::Other("Access denied".into()))?;
        let resp2 = fetch_debiteuren_list(&esma_client, &new_token).await?;
        if resp2.status() == 200 {
            resp2.text().await?
        } else {
            return Err(AppError::Other("[]".into()));
        }
    } else {
        return Err(AppError::Other("[]".into()));
    };

    let debiteuren: Vec<Debiteur> = serde_json::from_str(&text)?;
    let end = (skip + take).min(debiteuren.len());
    Ok(serde_json::to_string_pretty(&debiteuren[skip..end])?)
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

const EXALISE_API: &str = "https://api.exalise.com/api";

#[tauri::command(async)]
pub async fn get_quiz(state: State<'_, AppState>) -> Result<String, AppError> {
    let config = state.config.read().await;
    let res = state
        .http_client
        .get(format!("{}/getquiz", EXALISE_API))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?;
    read_api_response(res).await
}

#[tauri::command(async)]
pub async fn get_question(
    quiz_id: String,
    question_id: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let config = state.config.read().await;
    let url = if question_id.is_empty() {
        format!("{}/getquestion/{}", EXALISE_API, quiz_id)
    } else {
        format!("{}/getquestion/{}/{}", EXALISE_API, quiz_id, question_id)
    };
    let res = state
        .http_client
        .get(url)
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?;
    read_api_response(res).await
}

#[tauri::command(async)]
pub async fn get_end_answer(
    end_answer_id: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let config = state.config.read().await;
    let res = state
        .http_client
        .get(format!("{}/getendanswer/{}", EXALISE_API, end_answer_id))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?;
    read_api_response(res).await
}
