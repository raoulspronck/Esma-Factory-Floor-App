use tauri::Manager;

use crate::config::save_json;
use crate::state::AppState;

const FLUSH_INTERVAL_SECS: u64 = 60;
pub const CACHE_FILE_NAME: &str = "last_values.cache.json";
pub const DEVICE_DATA_CACHE_FILE_NAME: &str = "device_data.cache.json";

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
///
/// Skips writing an EMPTY map over a cache file that has content. This used to
/// write unconditionally, so a single boot that started with nothing in memory
/// (or a `post_remove_cache`) would, 60s later, overwrite a full
/// `last_values.cache.json` with `{}` — permanently destroying the disk seed that
/// lets widgets paint before the network is up. Every subsequent boot then also
/// started empty, which is why the cache was observed "sometimes full, sometimes
/// empty" with no obvious trigger. `flush_device_data` below already guarded this.
pub async fn flush_last_values(state: &AppState) {
    let snapshot = state.last_values.read().await.clone();
    let path = cache_file_path(state);

    if snapshot.is_empty() && disk_cache_is_populated(&path) {
        return;
    }

    let _ = save_json(&path, &snapshot);
}

/// Whether `path` holds a JSON object with at least one entry.
fn disk_cache_is_populated(path: &std::path::Path) -> bool {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
        .and_then(|v| v.as_object().map(|o| !o.is_empty()))
        .unwrap_or(false)
}

/// Reads a cache file from `app_data_dir`, falling back to the legacy
/// settings-dir location written by builds before the cache was relocated.
/// Returns `None` for a missing, unparseable, or empty object.
pub fn read_cache_with_legacy_fallback(
    app_data_dir: &std::path::Path,
    settings_dir: &std::path::Path,
    file_name: &str,
) -> Option<serde_json::Value> {
    let read = |dir: &std::path::Path| -> Option<serde_json::Value> {
        std::fs::read_to_string(dir.join(file_name))
            .ok()
            .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
            .filter(|v| v.as_object().map(|o| !o.is_empty()).unwrap_or(false))
    };
    read(app_data_dir).or_else(|| read(settings_dir))
}

/// Persists the current device shape to disk, if one has been fetched. Skips
/// writing when nothing has been fetched yet so we never clobber a good
/// on-disk shape with an empty one during a cold start.
pub async fn flush_device_data(state: &AppState) {
    if let Some(snapshot) = state.device_data.read().await.clone() {
        let _ = save_json(&device_data_cache_path(state), &snapshot);
    }
}
