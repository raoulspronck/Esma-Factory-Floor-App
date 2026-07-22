use tauri::Manager;

use crate::config::save_json;
use crate::state::AppState;

const FLUSH_INTERVAL_SECS: u64 = 60;
const CACHE_FILE_NAME: &str = "last_values.cache.json";
const DEVICE_DATA_CACHE_FILE_NAME: &str = "device_data.cache.json";

pub fn cache_file_path(state: &AppState) -> std::path::PathBuf {
    state.app_data_dir.join(CACHE_FILE_NAME)
}

/// Where the last successfully-fetched device shape (connected + datapoint
/// definitions) is persisted. Unlike `last_values`, device shape used to live
/// only in memory, so a cold start with the network down had no datapoint
/// types at all - which left type-formatted widgets unable to resolve. Seeding
/// this from disk lets the UI paint last-known shape immediately.
pub fn device_data_cache_path(state: &AppState) -> std::path::PathBuf {
    state.app_data_dir.join(DEVICE_DATA_CACHE_FILE_NAME)
}

/// Periodically snapshots the in-memory last-value cache to disk so a future restart
/// has a recent seed to paint the UI with immediately, before the fresh fetch completes.
pub fn start_periodic_flush(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval =
            tokio::time::interval(tokio::time::Duration::from_secs(FLUSH_INTERVAL_SECS));
        loop {
            interval.tick().await;
            let state = app_handle.state::<AppState>();
            flush_last_values(&state).await;
            flush_device_data(&state).await;
        }
    });
}

/// Best-effort, silent-failure write — matches this codebase's existing style.
pub async fn flush_last_values(state: &AppState) {
    let snapshot = state.last_values.read().await.clone();
    let _ = save_json(&cache_file_path(state), &snapshot);
}

/// Persists the current device shape to disk, if one has been fetched. Skips
/// writing when nothing has been fetched yet so we never clobber a good
/// on-disk shape with an empty one during a cold start.
pub async fn flush_device_data(state: &AppState) {
    if let Some(snapshot) = state.device_data.read().await.clone() {
        let _ = save_json(&device_data_cache_path(state), &snapshot);
    }
}
