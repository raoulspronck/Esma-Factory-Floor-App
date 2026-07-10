use std::path::PathBuf;

/// Returns the settings directory used since before the backend overhaul, so existing
/// installs keep reading the same files ("sofware" typo is intentional/historical).
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
