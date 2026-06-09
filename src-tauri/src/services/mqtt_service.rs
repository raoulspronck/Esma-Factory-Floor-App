use chrono::prelude::*;
use rumqttc::{AsyncClient, ConnAck, ConnectReturnCode, Event, EventLoop, Packet, QoS};
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::Manager; // for get_window, emit_all, state

use crate::state::AppState;

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

        loop {
            let notification = eventloop.poll().await;
            let time = Local::now().to_string();

            match notification {
                Ok(event) => {
                    let _ = main_window.emit(
                        "exalise-connection-status",
                        format!("{} - {:?}", time, event),
                    );

                    if !connected {
                        mqtt_connected.store(true, Ordering::Relaxed);
                        let _ = main_window.emit("exalise-connection", "connected");
                        let _ = client
                            .publish(
                                format!("exalise/lastwill/{}", device_key),
                                QoS::AtLeastOnce,
                                false,
                                "connected".as_bytes().to_vec(),
                            )
                            .await;
                        connected = true;
                    }

                    if let Event::Incoming(Packet::PingResp) = event {
                        let _ = main_window.emit("Ping", "check");
                    }

                    if let Event::Incoming(Packet::ConnAck(ConnAck {
                        session_present: _,
                        code,
                    })) = event
                    {
                        if let ConnectReturnCode::Success = code {
                            let _ = client
                                .subscribe("exalise/messages/#", QoS::AtMostOnce)
                                .await;
                            let _ = client
                                .subscribe("exalise/lastwill/#", QoS::AtMostOnce)
                                .await;
                        }
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
                                // Short topic: exalise/messages/{DATAPOINT}
                                let event_name = format!("notification---{}", vec_topic[2]);
                                let _ = main_window.emit(&event_name, &payload);

                                let state = app_handle.state::<AppState>();
                                state.update_last_value(vec_topic[2], &payload).await;
                            } else if vec_topic.len() >= 4 {
                                // Long topic: exalise/messages/{DEVICE}/{DATAPOINT_KEY}
                                let datapoint_parts: Vec<&str> = vec_topic[3].split('_').collect();
                                let msg_device_key = vec_topic[2];

                                // Handle remote shutdown command
                                if msg_device_key == device_key
                                    && datapoint_parts.first() == Some(&"Shutdown")
                                {
                                    request_shutdown(app_handle.clone(), 60);
                                    continue;
                                }

                                let cache_key =
                                    format!("{}---{}", msg_device_key, datapoint_parts[0]);
                                let event_name = format!("notification---{}", cache_key);
                                let _ = main_window.emit(&event_name, &payload);

                                let state = app_handle.state::<AppState>();
                                state.update_last_value(&cache_key, &payload).await;
                            }
                        } else if vec_topic[1] == "lastwill" {
                            let event_name = format!("notification---{}", vec_topic[2]);
                            let _ = main_window.emit(&event_name, &payload);
                        }
                    }
                }
                Err(e) => {
                    let _ = main_window
                        .emit("exalise-connection-status", format!("{:?}", e));
                    if connected {
                        mqtt_connected.store(false, Ordering::Relaxed);
                        let _ = main_window.emit("exalise-connection", "disconnected");
                        connected = false;
                    }
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
