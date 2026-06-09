use std::path::PathBuf;

/// Returns the settings directory, using $APPDATA on Windows (matching Tauri's app_data_dir).
/// Falls back to the current directory if the env var is missing.
pub fn compute_settings_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(appdata)
            .join("com.exalise.production-monitoring-software")
            .join("settings")
    }
    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("com.exalise.production-monitoring-software")
            .join("settings")
    }
}
