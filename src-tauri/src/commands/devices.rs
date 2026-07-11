use serde::Serialize;
use tauri::State;

use crate::commands::misc::append_log;
use crate::error::AppError;
use crate::state::AppState;

const EXALISE_API: &str = "https://api.exalise.com/api";

#[derive(Serialize, Clone)]
pub struct ConnectionTestResult {
    pub api_key: String,
    pub device_key: String,
    pub status_code: u16,
    pub success: bool,
    pub message: String,
}

/// Fires an authenticated request at the Exalise API using the credentials
/// currently configured on this machine, so a user can see exactly which
/// api key / device key this installation sends and whether the server
/// accepts them - without having to cross-reference server logs.
#[tauri::command(async)]
pub async fn test_exalise_connection(
    state: State<'_, AppState>,
) -> Result<ConnectionTestResult, AppError> {
    let (http_key, http_secret, device_key) = {
        let config = state.config.read().await;
        (
            config.exalise.http_settings.http_key.clone(),
            config.exalise.http_settings.http_secret.clone(),
            config.exalise.mqtt_settings.device_key.clone(),
        )
    };

    append_log(
        &state,
        &format!(
            "test_exalise_connection: testing with api_key='{}', device_key='{}'",
            http_key, device_key
        ),
    );

    let response = state
        .http_client
        .get(format!("{}/getdeviceorgroup", EXALISE_API))
        .header("x-api-key", &http_key)
        .header("x-api-secret", &http_secret)
        .header("x-master-device-key", &device_key)
        .send()
        .await;

    let response = match response {
        Ok(resp) => resp,
        Err(e) => {
            append_log(
                &state,
                &format!("test_exalise_connection request failed: {}", e),
            );
            return Ok(ConnectionTestResult {
                api_key: http_key,
                device_key,
                status_code: 0,
                success: false,
                message: format!("Request failed: {}", e),
            });
        }
    };

    let status_code = response.status().as_u16();
    let text = response.text().await.unwrap_or_default();
    let success = status_code == 200;

    let message = if success {
        match serde_json::from_str::<serde_json::Value>(&text) {
            Ok(json) => {
                let name = json
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("(unknown)");
                format!("Authenticated successfully. Own device found: \"{}\"", name)
            }
            Err(_) => "Authenticated successfully.".into(),
        }
    } else {
        text
    };

    append_log(
        &state,
        &format!(
            "test_exalise_connection result: status={} success={} message={}",
            status_code, success, message
        ),
    );

    Ok(ConnectionTestResult {
        api_key: http_key,
        device_key,
        status_code,
        success,
        message,
    })
}

#[tauri::command(async)]
pub async fn get_devices(state: State<'_, AppState>) -> Result<String, AppError> {
    let config = state.config.read().await;
    let response = state
        .http_client
        .get(format!("{}/getalldevicesanddevicegroups", EXALISE_API))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await;

    let response = match response {
        Ok(resp) => resp,
        Err(e) => {
            append_log(&state, &format!("get_devices HTTP request failed: {}", e));
            return Err(AppError::Http(e));
        }
    };

    let text = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            append_log(&state, &format!("get_devices response read failed: {}", e));
            return Err(AppError::Http(e));
        }
    };
    Ok(text)
}

#[tauri::command(async)]
pub async fn get_device(
    device_id: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let config = state.config.read().await;
    let response = state
        .http_client
        .get(format!("{}/getdeviceorgroup/{}", EXALISE_API, device_id))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await;

    let response = match response {
        Ok(resp) => resp,
        Err(e) => {
            append_log(&state, &format!("get_device HTTP request failed for {}: {}", device_id, e));
            return Err(AppError::Http(e));
        }
    };

    let text = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            append_log(&state, &format!("get_device response read failed for {}: {}", device_id, e));
            return Err(AppError::Http(e));
        }
    };
    Ok(text)
}

#[tauri::command(async)]
pub async fn get_own_device(state: State<'_, AppState>) -> Result<String, AppError> {
    let config = state.config.read().await;
    let response = state
        .http_client
        .get(format!("{}/getdeviceorgroup", EXALISE_API))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await;

    let response = match response {
        Ok(resp) => resp,
        Err(e) => {
            append_log(&state, &format!("get_own_device HTTP request failed: {}", e));
            return Err(AppError::Http(e));
        }
    };

    let text = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            append_log(&state, &format!("get_own_device response read failed: {}", e));
            return Err(AppError::Http(e));
        }
    };
    Ok(text)
}

#[tauri::command(async)]
pub async fn get_last_value(
    device_id: String,
    device_key: String,
    datapoint_key: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let cache_key = format!("{}---{}", device_key, datapoint_key);

    // Return cached value if available.
    if let Some(v) = state.get_last_value(&cache_key).await {
        append_log(
            &state,
            &format!(
                "get_last_value cache hit: key='{}' value='{}'",
                cache_key, v
            ),
        );
        return Ok(v);
    }

    append_log(
        &state,
        &format!(
            "get_last_value cache miss: key='{}', fetching from API for device_id='{}'",
            cache_key, device_id
        ),
    );

    // Fall back to Exalise API.
    let config = state.config.read().await;
    let response = state
        .http_client
        .get(format!("{}/getvalue/{}/{}", EXALISE_API, device_id, datapoint_key))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await;

    let response = match response {
        Ok(resp) => resp,
        Err(e) => {
            append_log(
                &state,
                &format!(
                    "get_last_value HTTP request failed for {}/{}: {}",
                    device_id, datapoint_key, e
                ),
            );
            return Err(AppError::Http(e));
        }
    };

    let value = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            append_log(
                &state,
                &format!(
                    "get_last_value response read failed for {}/{}: {}",
                    device_id, datapoint_key, e
                ),
            );
            return Err(AppError::Http(e));
        }
    };

    append_log(
        &state,
        &format!(
            "get_last_value API response: key='{}' value='{}'",
            cache_key, value
        ),
    );

    state.update_last_value(&cache_key, &value).await;
    Ok(value)
}

#[tauri::command(async)]
pub async fn post_remove_cache(state: State<'_, AppState>) -> Result<String, AppError> {
    state.last_values.write().await.clear();
    *state.device_data.write().await = None;
    let _ = std::fs::remove_file(crate::services::cache_persist::cache_file_path(&state));
    Ok("Cache removed successfully".into())
}
