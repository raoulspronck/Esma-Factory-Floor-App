use rumqttc::{AsyncClient, ConnAck, ConnectReturnCode, Event, EventLoop, Packet, QoS};
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration as StdDuration, Instant};
use tauri::Manager; // for get_window, emit_all, state

use crate::commands::misc::log_event;
use crate::state::AppState;

/// Once a connection error has been logged, further errors from the same
/// outage are suppressed for this long - `rumqttc` retries every second with
/// no backoff of its own, so without this a prolonged broker outage would
/// write one line to logs.txt per second (86k+ lines/day) instead of one
/// entry plus periodic reminders.
const ERROR_LOG_INTERVAL: StdDuration = StdDuration::from_secs(5 * 60);

/// Spawns the MQTT event loop task.
/// Handles connection, subscriptions, message routing, and window event emission.
pub fn start_mqtt_loop(
    mut eventloop: EventLoop,
    client: AsyncClient,
    device_key: String,
    mqtt_connected: Arc<AtomicBool>,
    app_handle: tauri::AppHandle,
) {
    tauri::async_runtime::spawn(async move {
        let main_window = app_handle.get_window("main").unwrap();
        let mut connected = false;
        // None until the first error of the current outage is logged; Some
        // once logged, so later errors in the same outage stay throttled.
        let mut last_error_logged: Option<Instant> = None;

        loop {
            let notification = eventloop.poll().await;

            match notification {
                Ok(event) => {
                    if let Event::Incoming(Packet::ConnAck(ConnAck {
                        session_present: _,
                        code,
                    })) = &event
                    {
                        if let ConnectReturnCode::Success = code {
                            if !connected {
                                mqtt_connected.store(true, Ordering::Relaxed);
                                let _ = main_window.emit("exalise-connection", "connected");
                                connected = true;
                                let state = app_handle.state::<AppState>();
                                let message = if last_error_logged.is_some() {
                                    "Reconnected to broker"
                                } else {
                                    "Connected to broker"
                                };
                                log_event(&state, &app_handle, "mqtt", message);
                                last_error_logged = None;
                            }
                            let _ = client
                                .subscribe("exalise/messages/#", QoS::AtMostOnce)
                                .await;
                            let _ = client
                                .subscribe("exalise/lastwill/#", QoS::AtMostOnce)
                                .await;
                        }
                    }

                    if let Event::Incoming(Packet::PingResp) = event {
                        let _ = main_window.emit("Ping", "check");
                    }

                    if let Event::Incoming(Packet::Publish(p)) = event {
                        let payload = match str::from_utf8(p.payload.as_ref()) {
                            Ok(s) => s.to_string(),
                            Err(_) => continue,
                        };

                        let topic = p.topic.clone();
                        let vec_topic: Vec<&str> = topic.split('/').collect();

                        if vec_topic.len() < 3 {
                            continue;
                        }

                        if vec_topic[1] == "messages" {
                            if vec_topic.len() == 3 {
                                // Short topic: exalise/messages/{DATAPOINT}. Always
                                // relayed to the frontend (alerts/monitoring want
                                // everything), but never cached: with no device
                                // segment there's nothing to validate it against, and
                                // nothing in this app ever reads a bare-key entry back
                                // out of last_values.
                                let event_name = format!("notification---{}", vec_topic[2]);
                                let _ = main_window.emit(&event_name, &payload);
                            } else if vec_topic.len() >= 4 {
                                // Long topic: exalise/messages/{DEVICE}/{DATAPOINT_KEY}
                                let msg_device_key = vec_topic[2];
                                let datapoint_key = vec_topic[3..].join("/");

                                // Handle remote shutdown command
                                if msg_device_key == device_key
                                    && datapoint_key.starts_with("Shutdown")
                                {
                                    request_shutdown(app_handle.clone(), 60);
                                    continue;
                                }

                                let cache_key = format!("{}---{}", msg_device_key, datapoint_key);
                                let event_name = format!("notification---{}", cache_key);
                                let _ = main_window.emit(&event_name, &payload);

                                // The broker delivers retained messages from every
                                // device under exalise/messages/#, including ones this
                                // installation doesn't own - only persist ones for
                                // devices actually in this dashboard (or this kiosk's
                                // own master key) into last_values/the disk cache.
                                let state = app_handle.state::<AppState>();
                                if state.known_device_keys.read().await.contains(msg_device_key) {
                                    state.update_last_value(&cache_key, &payload).await;
                                }
                            }
                        } else if vec_topic[1] == "lastwill" {
                            let event_name = format!("notification---{}", vec_topic[2]);
                            let _ = main_window.emit(&event_name, &payload);
                        }
                    }
                }
                Err(e) => {
                    if connected {
                        mqtt_connected.store(false, Ordering::Relaxed);
                        let _ = main_window.emit("exalise-connection", "disconnected");
                        connected = false;
                    }

                    let should_log = match last_error_logged {
                        None => true,
                        Some(last) => last.elapsed() >= ERROR_LOG_INTERVAL,
                    };
                    if should_log {
                        let state = app_handle.state::<AppState>();
                        log_event(&state, &app_handle, "mqtt", &format!("Connection error: {:?}", e));
                        last_error_logged = Some(Instant::now());
                    }

                    // rumqttc does not back off on its own; without a delay here a
                    // persistent connect failure spins into a tight reconnect loop that
                    // hammers socket creation and can trip spurious OS-level socket
                    // errors (e.g. WSAStartup failures on Windows).
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                }
            }
        }
    });
}

fn shutdown_computer() {
    use tauri::api::process::Command;
    if cfg!(target_os = "windows") {
        let _ = Command::new("shutdown").args(&["/s", "/t", "0"]).output();
    } else {
        let _ = Command::new("shutdown").args(&["-h", "now"]).output();
    }
}

/// Emits a `"shutdown-requested"` event to the frontend and schedules an OS shutdown
/// after `delay_seconds` unless cancelled via the `cancel_shutdown` command.
pub fn request_shutdown(app_handle: tauri::AppHandle, delay_seconds: u64) {
    let shutdown_pending = {
        let state = app_handle.state::<AppState>();
        state.shutdown_pending.store(true, Ordering::Relaxed);
        state.shutdown_pending.clone()
    };
    let _ = app_handle.emit_all("shutdown-requested", delay_seconds);

    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(delay_seconds)).await;
        if shutdown_pending.load(Ordering::Relaxed) {
            shutdown_computer();
        }
    });
}

/// Checks whether it is a day-off and requests a graceful countdown shutdown if so.
/// Must be called after the main window is open so the countdown dialog can appear.
pub async fn check_day_off(
    http_client: &reqwest::Client,
    http_key: &str,
    http_secret: &str,
    device_key: &str,
    app_handle: tauri::AppHandle,
) {
    let result = http_client
        .get("https://api.exalise.com/api/getisdayoff")
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await;

    if let Ok(resp) = result {
        if let Ok(text) = resp.text().await {
            if text.trim() == "True" {
                request_shutdown(app_handle, 60);
            }
        }
    }
}
