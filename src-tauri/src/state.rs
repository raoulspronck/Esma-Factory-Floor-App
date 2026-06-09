use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use rumqttc::AsyncClient;

use crate::models::settings::{ApiSettings, BasicSettings, ExaliseSettings};

/// All runtime state in one place, managed by Tauri.
pub struct AppState {
    /// Shared HTTP client — never create a new one per-request.
    pub http_client: reqwest::Client,
    /// MQTT publisher handle (the event loop lives in a spawned task).
    pub mqtt_client: Mutex<AsyncClient>,
    /// In-memory cache of last known values per datapoint key (`"deviceKey---datapointKey"`).
    pub last_values: RwLock<HashMap<String, String>>,
    /// All user-editable configuration. Write-locked when saving; reading is cheap.
    pub config: RwLock<AppConfig>,
    /// True while the MQTT broker connection is active.
    pub mqtt_connected: Arc<AtomicBool>,
    /// Set to true when a shutdown countdown is in progress.
    /// Cleared by `cancel_shutdown` command; checked after the delay expires.
    pub shutdown_pending: Arc<AtomicBool>,
    /// Resolved settings directory; injected once at startup.
    pub settings_dir: PathBuf,
}

/// Groups all user configuration so it can be read/updated atomically.
pub struct AppConfig {
    pub exalise: ExaliseSettings,
    pub api: ApiSettings,
    pub basic: BasicSettings,
}

impl AppState {
    pub async fn update_last_value(&self, key: &str, value: &str) {
        let mut map = self.last_values.write().await;
        map.insert(key.to_string(), value.to_string());
    }

    pub async fn get_last_value(&self, key: &str) -> Option<String> {
        let map = self.last_values.read().await;
        map.get(key).cloned()
    }
}
