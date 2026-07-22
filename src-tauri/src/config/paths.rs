use std::path::PathBuf;

const APP_ID: &str = "com.exalise.production-monitoring-software";

/// Returns the settings directory used since before the backend overhaul, so existing
/// installs keep reading the same files ("sofware" typo is intentional/historical).
///
/// NOTE: this path is hardcoded to the `Gebruiker` user. It is fine for reading
/// deployment-managed config (dashboard/settings), but it is NOT reliably
/// writable on a kiosk whose Windows user isn't `Gebruiker` - so anything the
/// app must *write* at runtime (caches, and the log fallback) uses
/// `compute_app_data_dir` instead. See that function.
pub fn compute_settings_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        PathBuf::from("C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings")
    }
    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home)
            .join("Documents")
            .join("cnc-monitoring-sofware-settings")
    }
}

/// Per-user, always-writable directory for runtime files the app persists
/// itself (the last-value / device-shape caches, and the log fallback).
///
/// Unlike `compute_settings_dir`, this resolves under the *current* user's local
/// app-data (`%LOCALAPPDATA%\<app id>` on Windows), so writes never silently
/// no-op just because the kiosk runs as a different Windows user than the one
/// baked into the settings path. That silent-write-failure was why a kiosk could
/// show no data *and* no log lines ("no errors") while the same build worked on
/// the developer's `Gebruiker` account.
pub fn compute_app_data_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        match std::env::var("LOCALAPPDATA") {
            Ok(local) if !local.is_empty() => PathBuf::from(local).join(APP_ID),
            // LOCALAPPDATA is effectively always set on Windows; fall back to the
            // settings dir only so this can never panic.
            _ => compute_settings_dir(),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".local").join("share").join(APP_ID)
    }
}
