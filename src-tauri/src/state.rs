use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::{Mutex, Notify, RwLock};
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
    /// In-memory cache of device/group shape (connected + datapoint definitions),
    /// keyed by device id, as returned by `/api/getdashboarddata`. Seeded from
    /// `device_data.cache.json` at startup and refreshed by the background
    /// refresher, so it is `None` only on a machine that has never once fetched.
    pub device_data: RwLock<Option<serde_json::Value>>,
    /// Serializes dashboard fetches so overlapping refresh requests collapse into
    /// one HTTP call. Only the background refresher ever takes this - no
    /// frontend-facing command may block on it (see `get_dashboard_data`).
    pub dashboard_fetch_lock: Mutex<()>,
    /// Poked to ask the background refresher to fetch now instead of waiting out
    /// its backoff/interval. Used on dashboard edits and by the Refetch button.
    pub refresh_request: Arc<Notify>,
    /// True once a live `/api/getdashboarddata` fetch has succeeded this session,
    /// i.e. the caches hold fresh data rather than the disk seed.
    pub dashboard_data_fresh: Arc<AtomicBool>,
    /// True once the webview has called `frontend_ready`, i.e. once a
    /// `dashboard-hydrated` emit can actually be received. Tauri drops events
    /// emitted at a window whose page hasn't registered listeners yet, silently
    /// - this flag is what stops us logging such a push as delivered.
    pub frontend_ready: Arc<AtomicBool>,
    /// Device keys this installation actually owns: every `device.key` in the
    /// current dashboard plus this kiosk's own master `device_key`. The MQTT
    /// event loop subscribes to `exalise/messages/#` (needed so the frontend can
    /// see all traffic for alerts/monitoring), which also delivers retained
    /// messages from unrelated devices on the broker - this set is used to keep
    /// those out of `last_values`/the persisted cache without dropping the
    /// events the frontend receives. Refreshed on startup and whenever the
    /// dashboard is saved.
    pub known_device_keys: RwLock<HashSet<String>>,
    /// All user-editable configuration. Write-locked when saving; reading is cheap.
    pub config: RwLock<AppConfig>,
    /// True while the MQTT broker connection is active.
    pub mqtt_connected: Arc<AtomicBool>,
    /// Set to true when a shutdown countdown is in progress.
    /// Cleared by `cancel_shutdown` command; checked after the delay expires.
    pub shutdown_pending: Arc<AtomicBool>,
    /// Resolved settings directory; injected once at startup. Used for reading
    /// deployment-managed config (dashboard/settings). May be read-only on a
    /// locked-down kiosk - do not rely on it for runtime writes.
    pub settings_dir: PathBuf,
    /// Per-user, always-writable directory for runtime files the app persists
    /// itself: the last-value / device-shape caches and the log fallback. See
    /// `config::paths::compute_app_data_dir`.
    pub app_data_dir: PathBuf,
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

    /// Asks the background refresher to fetch dashboard data now. Fire-and-forget:
    /// if the refresher is already mid-fetch the wake-up is coalesced into the
    /// next loop iteration, so callers never block on the network.
    pub fn request_refresh(&self) {
        self.refresh_request.notify_one();
    }

    pub fn is_frontend_ready(&self) -> bool {
        self.frontend_ready.load(Ordering::Relaxed)
    }
}
