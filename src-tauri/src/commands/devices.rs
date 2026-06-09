use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

const EXALISE_API: &str = "https://api.exalise.com/api";

#[tauri::command(async)]
pub async fn get_devices(state: State<'_, AppState>) -> Result<String, AppError> {
    let config = state.config.read().await;
    let res = state
        .http_client
        .get(format!("{}/getalldevicesanddevicegroups", EXALISE_API))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?
        .text()
        .await?;
    Ok(res)
}

#[tauri::command(async)]
pub async fn get_device(
    device_id: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    let config = state.config.read().await;
    let res = state
        .http_client
        .get(format!("{}/getdeviceorgroup/{}", EXALISE_API, device_id))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?
        .text()
        .await?;
    Ok(res)
}

#[tauri::command(async)]
pub async fn get_own_device(state: State<'_, AppState>) -> Result<String, AppError> {
    let config = state.config.read().await;
    let res = state
        .http_client
        .get(format!("{}/getdeviceorgroup", EXALISE_API))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?
        .text()
        .await?;
    Ok(res)
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
        return Ok(v);
    }

    // Fall back to Exalise API.
    let config = state.config.read().await;
    let value = state
        .http_client
        .get(format!("{}/getvalue/{}/{}", EXALISE_API, device_id, datapoint_key))
        .header("x-api-key", &config.exalise.http_settings.http_key)
        .header("x-api-secret", &config.exalise.http_settings.http_secret)
        .header("x-master-device-key", &config.exalise.mqtt_settings.device_key)
        .send()
        .await?
        .text()
        .await?;

    state.update_last_value(&cache_key, &value).await;
    Ok(value)
}

#[tauri::command(async)]
pub async fn post_remove_cache(state: State<'_, AppState>) -> Result<String, AppError> {
    state.last_values.write().await.clear();
    Ok("Cache removed successfully".into())
}
