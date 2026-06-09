use rumqttc::QoS;
use std::sync::atomic::Ordering;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command(async)]
pub async fn send_message(
    device_key: String,
    datapoint: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<bool, AppError> {
    let client = state.mqtt_client.lock().await;
    client
        .publish(
            format!("exalise/messages/{}/{}", device_key, datapoint),
            QoS::AtLeastOnce,
            false,
            value.as_bytes().to_vec(),
        )
        .await
        .map_err(|e| AppError::Other(e.to_string()))?;
    Ok(true)
}

#[tauri::command]
pub fn get_exalise_connection(state: State<'_, AppState>) -> bool {
    state.mqtt_connected.load(Ordering::Relaxed)
}

#[tauri::command]
pub fn cancel_shutdown(state: State<'_, AppState>) {
    state.shutdown_pending.store(false, Ordering::Relaxed);
}
