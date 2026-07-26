use std::path::Path;

use chrono::{Duration, NaiveDateTime};
use tauri::Manager;

use crate::state::AppState;

const RETENTION_DAYS: i64 = 30;
const PRUNE_INTERVAL_SECS: u64 = 24 * 60 * 60;
const TIMESTAMP_LEN: usize = "31-12-2025 23:59:59".len();

/// Keeps `logs.txt` bounded to the last 30 days so a kiosk that stays up for
/// months doesn't accumulate an unbounded file. Runs once immediately (the
/// first `interval.tick()` fires right away) and then once a day.
pub fn start_periodic_prune(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(PRUNE_INTERVAL_SECS));
        loop {
            interval.tick().await;
            let state = app_handle.state::<AppState>();
            prune_log_file(&state.settings_dir.join("logs.txt"));
            prune_log_file(&state.app_data_dir.join("logs.txt"));
        }
    });
}

/// Drops every line whose leading `dd-mm-yyyy HH:MM:SS` timestamp is older
/// than `RETENTION_DAYS`. Lines that don't start with a parseable timestamp
/// are kept rather than dropped - safer to over-retain than to risk silently
/// discarding real log data on a format we don't recognize.
fn prune_log_file(path: &Path) {
    let Ok(content) = std::fs::read_to_string(path) else {
        return;
    };

    let cutoff = chrono::Local::now().naive_local() - Duration::days(RETENTION_DAYS);

    let kept: String = content
        .lines()
        .filter(|line| {
            let Some(prefix) = line.get(0..TIMESTAMP_LEN) else {
                return true;
            };
            match NaiveDateTime::parse_from_str(prefix, "%d-%m-%Y %H:%M:%S") {
                Ok(ts) => ts >= cutoff,
                Err(_) => true,
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    if kept.len() == content.trim_end_matches('\n').len() {
        return; // nothing dropped, skip the rewrite
    }

    let _ = std::fs::write(path, format!("{}\n", kept));
}
