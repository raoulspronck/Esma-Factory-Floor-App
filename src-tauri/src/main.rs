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
    dashboard::{get_dashboard, initialize_last_values, save_dashboard_layout, save_device_to_dashboard, save_widget_to_dashboard},
    devices::{get_device, get_devices, get_last_value, get_own_device, post_remove_cache},
    misc::{close_splashscreen, get_debiteuren, get_end_answer, get_pdf_file, get_question, get_quiz, write_to_log_file},
    mqtt::{cancel_shutdown, get_exalise_connection, send_message},
    rs232::{get_all_availble_ports, start_file_receive, start_file_send, stop_file_receive, stop_file_send},
    settings::{
        get_alerts, get_api_settings, get_basic_settings, get_exalise_settings,
        save_alerts, save_api_settings, save_basic_settings, save_exalise_http_settings,
        save_exalise_mqtt_settings, save_rs232_settings,
    },
};
use crate::config::{load_or_default, paths::compute_settings_dir, save_json};
use crate::models::settings::{ApiSettings, BasicSettings, ExaliseSettings};
use crate::services::{mqtt_service, rs232_service::start_rs232_monitor};
use crate::state::{AppConfig, AppState};

const BROKER_URL: &str = "mqtt.exalise.com";
const BROKER_PORT: u16 = 1883;

#[tokio::main]
async fn main() {
    let settings_dir = compute_settings_dir();
    std::fs::create_dir_all(&settings_dir).ok();

    // Load all configuration with DRY generic loader.
    let exalise: ExaliseSettings = load_or_default(&settings_dir.join("settings.exalise.json"));
    let api: ApiSettings = load_or_default(&settings_dir.join("api.settings.json"));
    let basic: BasicSettings = load_or_default(&settings_dir.join("basic.settings.json"));

    let http_client = reqwest::Client::new();

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
        last_values: RwLock::new(HashMap::new()),
        config: RwLock::new(AppConfig { exalise, api, basic }),
        mqtt_connected: mqtt_connected.clone(),
        shutdown_pending: Arc::new(AtomicBool::new(false)),
        settings_dir: settings_dir.clone(),
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

            // Pre-populate last-value cache in the background.
            let app_handle_init = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle_init.state::<AppState>();
                initialize_last_values(&state).await;
            });

            // Day-off check — runs after the window opens so the countdown dialog can appear.
            let app_handle_dayoff = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                // Brief delay so the window is rendered before we might show the countdown.
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                let state = app_handle_dayoff.state::<AppState>();
                let (http_key, http_secret, device_key) = {
                    let config = state.config.read().await;
                    (
                        config.exalise.http_settings.http_key.clone(),
                        config.exalise.http_settings.http_secret.clone(),
                        config.exalise.mqtt_settings.device_key.clone(),
                    )
                };
                mqtt_service::check_day_off(
                    &state.http_client,
                    &http_key,
                    &http_secret,
                    &device_key,
                    app_handle_dayoff.clone(),
                )
                .await;
            });

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
            get_debiteuren,
            get_quiz,
            get_question,
            get_end_answer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
