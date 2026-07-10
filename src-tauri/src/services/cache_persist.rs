use tauri::Manager;

use crate::config::save_json;
use crate::state::AppState;

const FLUSH_INTERVAL_SECS: u64 = 60;
const CACHE_FILE_NAME: &str = "last_values.cache.json";

pub fn cache_file_path(state: &AppState) -> std::path::PathBuf {
    state.settings_dir.join(CACHE_FILE_NAME)
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
        }
    });
}

/// Best-effort, silent-failure write — matches this codebase's existing style.
pub async fn flush_last_values(state: &AppState) {
    let snapshot = state.last_values.read().await.clone();
    let _ = save_json(&cache_file_path(state), &snapshot);
}
