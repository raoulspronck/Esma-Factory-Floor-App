#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod config;
mod error;
mod models;
mod services;
mod state;

use std::collections::HashMap;
use std::sync::{atomic::AtomicBool, Arc};

use rumqttc::{AsyncClient, LastWill, MqttOptions, QoS};
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tokio::sync::{Mutex, RwLock};
use tokio::time::Duration;

use crate::commands::{
    dashboard::{compute_known_device_keys, frontend_ready, get_dashboard, get_dashboard_data, request_dashboard_refresh, save_dashboard_layout, save_device_to_dashboard, save_widget_to_dashboard},
    devices::{get_device, get_devices, get_last_value, get_own_device, post_remove_cache, test_exalise_connection},
    kiosk::{kiosk_clock, kiosk_get_employees, kiosk_register_screen, kiosk_set_initial_pin},
    misc::{close_splashscreen, get_debiteuren, get_end_answer, get_pdf_file, get_question, get_quiz, log_event, read_log_file, write_to_log_file},
    mqtt::{cancel_shutdown, get_exalise_connection, send_message},
    rs232::{get_all_availble_ports, start_file_receive, start_file_send, stop_file_receive, stop_file_send},
    settings::{
        get_alerts, get_api_settings, get_basic_settings, get_exalise_settings,
        save_alerts, save_api_settings, save_basic_settings,
        save_exalise_http_settings, save_exalise_mqtt_settings, save_rs232_settings,
    },
};
use crate::config::{load_or_default, paths::{compute_app_data_dir, compute_settings_dir}, save_json};
use crate::models::settings::{ApiSettings, BasicSettings, ExaliseSettings};
use crate::services::{cache_persist, log_retention, mqtt_service, rs232_service::start_rs232_monitor};
use crate::state::{AppConfig, AppState};

const BROKER_URL: &str = "mqtt.exalise.com";
const BROKER_PORT: u16 = 1883;

/// How often the background refresher re-fetches dashboard data once it is
/// succeeding. Values also arrive live over MQTT; this keeps device shape and any
/// HTTP-only datapoints current, and re-establishes data after a wifi outage.
const DASHBOARD_REFRESH_INTERVAL_SECS: u64 = 300;

#[tokio::main]
async fn main() {
    let settings_dir = compute_settings_dir();
    std::fs::create_dir_all(&settings_dir).ok();

    // Per-user, always-writable location for runtime files (caches + log
    // fallback). The settings dir above is hardcoded to the `Gebruiker` user and
    // is not writable on a kiosk running as a different Windows account, which
    // made cache writes and log lines silently vanish there.
    let app_data_dir = compute_app_data_dir();
    std::fs::create_dir_all(&app_data_dir).ok();

    // Load all configuration with DRY generic loader.
    let exalise: ExaliseSettings = load_or_default(&settings_dir.join("settings.exalise.json"));
    let api: ApiSettings = load_or_default(&settings_dir.join("api.settings.json"));
    let basic: BasicSettings = load_or_default(&settings_dir.join("basic.settings.json"));

    // Seed BOTH caches from the previous session so the UI can paint
    // last-known-good readings the instant the window opens, with no network at
    // all. Each falls back to the pre-relocation settings-dir copy so upgrading
    // installs don't start cold.
    //
    // Seeding `device_data` here (it used to start as `None` on every launch, and
    // was only ever read back from disk inside get_dashboard_data's error branch)
    // is what removes the network from the startup path entirely: shape and values
    // are both in memory before the webview exists.
    let persisted_last_values: HashMap<String, String> =
        cache_persist::read_cache_with_legacy_fallback(
            &app_data_dir,
            &settings_dir,
            cache_persist::CACHE_FILE_NAME,
        )
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let persisted_device_data: Option<serde_json::Value> =
        cache_persist::read_cache_with_legacy_fallback(
            &app_data_dir,
            &settings_dir,
            cache_persist::DEVICE_DATA_CACHE_FILE_NAME,
        );

    // Device keys this installation actually owns - used to keep retained MQTT
    // messages from unrelated devices on the broker out of last_values/the
    // persisted cache. See AppState::known_device_keys.
    let known_device_keys = compute_known_device_keys(&settings_dir, &exalise.mqtt_settings.device_key);

    // No request in this app previously had a timeout, so a stuck backend (e.g.
    // a saturated DB connection pool) hung the caller - and the UI - forever
    // instead of failing fast. get_dashboard_data's single-flight lock means a
    // hang here blocks every other caller waiting on the same lock, too.
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .expect("failed to build HTTP client");

    // Optionally pull the remote default dashboard before starting.
    if basic.automatic_load_dashboard == "True" {
        if let Ok(resp) = http_client
            .get("https://gist.githubusercontent.com/raoulspronck/60df74173b8ff477eb5af601f8007f59/raw")
            .send()
            .await
        {
            if let Ok(text) = resp.text().await {
                if let Ok(dashboard) =
                    serde_json::from_str::<crate::models::dashboard::Dashboard>(&text)
                {
                    let _ = save_json(&settings_dir.join("dashboard.exalise.json"), &dashboard);
                }
            }
        }
    }

    // Build MQTT client; keep a clone for the event-loop service, one for send_message.
    let device_key = exalise.mqtt_settings.device_key.clone();
    let mut mqttoptions = MqttOptions::new(device_key.clone(), BROKER_URL, BROKER_PORT);
    mqttoptions.set_last_will(LastWill::new(
        format!("exalise/lastwill/{}", device_key),
        "disconnected",
        QoS::AtLeastOnce,
        false,
    ));
    mqttoptions.set_credentials(
        exalise.mqtt_settings.mqtt_key.clone(),
        exalise.mqtt_settings.mqtt_secret.clone(),
    );
    mqttoptions.set_keep_alive(Duration::from_secs(5));
    mqttoptions.set_clean_session(false);

    let (mqtt_client, eventloop) = AsyncClient::new(mqttoptions, 10);
    let mqtt_client_for_service = mqtt_client.clone(); // goes to the event-loop task

    let mqtt_connected = Arc::new(AtomicBool::new(false));
    let mqtt_connected_for_rs232 = mqtt_connected.clone();

    let rs232 = exalise.rs232_settings.clone();
    let device_key_for_rs232 = device_key.clone();

    let app_state = AppState {
        http_client,
        mqtt_client: Mutex::new(mqtt_client),
        last_values: RwLock::new(persisted_last_values),
        device_data: RwLock::new(persisted_device_data),
        dashboard_fetch_lock: Mutex::new(()),
        refresh_request: Arc::new(tokio::sync::Notify::new()),
        dashboard_data_fresh: Arc::new(AtomicBool::new(false)),
        frontend_ready: Arc::new(AtomicBool::new(false)),
        known_device_keys: RwLock::new(known_device_keys),
        config: RwLock::new(AppConfig { exalise, api, basic }),
        mqtt_connected: mqtt_connected.clone(),
        shutdown_pending: Arc::new(AtomicBool::new(false)),
        settings_dir: settings_dir.clone(),
        app_data_dir: app_data_dir.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![""]),
        ))
        .manage(app_state)
        .setup(move |app| {
            let app_handle = app.handle();

            // The single owner of dashboard fetching. It is the ONLY thing in the
            // app that talks to /api/getdashboarddata, so no frontend command can
            // ever end up blocked on the network or on `dashboard_fetch_lock`.
            //
            // It never exits: backoff-retry while attempts fail, then a steady
            // refresh interval. The old loop `break`ed on first success, so after
            // that point nothing refreshed device shape or values except MQTT
            // pushes and user action. Every attempt - success or failure - ends in
            // a `dashboard-hydrated` push, so the UI converges even if the very
            // first fetch is minutes late.
            let app_handle_refresh = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle_refresh.state::<AppState>();
                let refresh_request = state.refresh_request.clone();
                let mut failures: u32 = 0;
                let mut successes: u32 = 0;

                loop {
                    let ok = commands::dashboard::refresh_dashboard_data(
                        &state,
                        &app_handle_refresh,
                    )
                    .await;

                    let delay = if ok {
                        failures = 0;
                        DASHBOARD_REFRESH_INTERVAL_SECS
                    } else {
                        failures += 1;
                        std::cmp::min(2u64.saturating_pow(failures), 30)
                    };
                    // This loop runs for the life of the app, so a kiosk that is
                    // offline all day would otherwise write thousands of identical
                    // lines. Log every outcome while things are going wrong or just
                    // recovered, then only occasionally once it's steady.
                    let noisy_phase = !ok || failures > 0 || successes == 0;
                    if noisy_phase || successes % 12 == 0 {
                        log_event(
                            &state,
                            &app_handle_refresh,
                            "dashboard",
                            &format!(
                                "dashboard refresher: attempt {}, next in {}s (consecutive failures: {})",
                                if ok { "succeeded" } else { "failed" },
                                delay,
                                failures
                            ),
                        );
                    }
                    if ok {
                        successes = successes.saturating_add(1);
                    }

                    // Wake early if something asks for a refresh (frontend ready,
                    // dashboard edited, Refetch pressed).
                    tokio::select! {
                        _ = tokio::time::sleep(Duration::from_secs(delay)) => {}
                        _ = refresh_request.notified() => {
                            log_event(
                                &state,
                                &app_handle_refresh,
                                "dashboard",
                                "dashboard refresher: woken by refresh request",
                            );
                        }
                    }
                }
            });

            // Periodically persist the (MQTT-updated) in-memory cache to disk, so a
            // future restart has a recent seed to paint the UI with instantly.
            cache_persist::start_periodic_flush(app_handle.clone());

            // Bound logs.txt to the last 30 days - runs once immediately (so a
            // kiosk that's had this growing unbounded for months gets trimmed
            // right away) and then once a day.
            log_retention::start_periodic_prune(app_handle.clone());

            // Day-off check now runs from close_splashscreen (misc.rs), invoked
            // by the frontend once it's actually ready to receive events -
            // see the comment there for why a fixed post-setup delay wasn't
            // reliable.

            // Start the RS232 monitoring loop.
            let main_window = app.get_window("main").unwrap();
            start_rs232_monitor(
                rs232.port_name,
                rs232.baud_rate,
                rs232.data_bits_number,
                rs232.parity_string,
                rs232.stop_bits_number,
                device_key_for_rs232,
                mqtt_connected_for_rs232,
                main_window,
            );

            // Start the MQTT event loop (uses the pre-cloned client).
            mqtt_service::start_mqtt_loop(
                eventloop,
                mqtt_client_for_service,
                device_key,
                mqtt_connected,
                app_handle,
            );

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Dashboard
            get_dashboard,
            get_dashboard_data,
            frontend_ready,
            request_dashboard_refresh,
            save_device_to_dashboard,
            save_widget_to_dashboard,
            save_dashboard_layout,
            // Settings
            get_exalise_settings,
            save_exalise_mqtt_settings,
            save_exalise_http_settings,
            save_rs232_settings,
            get_api_settings,
            save_api_settings,
            get_basic_settings,
            save_basic_settings,
            get_alerts,
            save_alerts,
            // Devices & values
            get_devices,
            get_device,
            get_own_device,
            get_last_value,
            post_remove_cache,
            test_exalise_connection,
            // MQTT
            send_message,
            get_exalise_connection,
            cancel_shutdown,
            // RS232
            get_all_availble_ports,
            start_file_send,
            stop_file_send,
            start_file_receive,
            stop_file_receive,
            // Misc
            close_splashscreen,
            get_pdf_file,
            write_to_log_file,
            read_log_file,
            get_debiteuren,
            get_quiz,
            get_question,
            get_end_answer,
            // Time clock (kiosk)
            kiosk_get_employees,
            kiosk_set_initial_pin,
            kiosk_clock,
            kiosk_register_screen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
