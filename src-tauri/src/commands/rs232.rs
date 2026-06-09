use serialport::available_ports;
use std::fs::File;
use std::io::{Read, Write};
use std::sync::atomic::Ordering;
use tauri::{Manager, State};
use tokio::time::{sleep, Duration};

use crate::error::AppError;
use crate::services::rs232_service::{
    map_data_bits, map_parity, map_stop_bits, MAIN_THREAD_RUNNING, MAIN_THREAD_SWITCH,
    RECEIVE_THREAD_RUNNING, RECEIVE_THREAD_SWITCH, SEND_THREAD_RUNNING, SEND_THREAD_SWITCH,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_all_availble_ports() -> Result<Vec<String>, AppError> {
    let ports = available_ports().map_err(|e| AppError::Other(e.to_string()))?;
    Ok(ports.into_iter().map(|p| p.port_name).collect())
}

#[tauri::command(async)]
pub async fn stop_file_send() -> bool {
    if SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
        SEND_THREAD_SWITCH.store(true, Ordering::Relaxed);
        while SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }
    true
}

#[tauri::command(async)]
pub async fn stop_file_receive(file_path: String) -> bool {
    if RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
        RECEIVE_THREAD_SWITCH.store(true, Ordering::Relaxed);
        while RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }
    std::fs::remove_file(file_path).is_ok()
}

#[tauri::command(async)]
pub async fn start_file_receive(
    file_path: String,
    start_decimal: u8,
    stop_decimal: u8,
    forbidden_decimals: Vec<u8>,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    if file_path.is_empty() {
        return Err("No file path specified".into());
    }

    let (port_name, baud_rate, data_bits_number, parity_string, stop_bits_number) = {
        let config = state.config.read().await;
        let rs = &config.exalise.rs232_settings;
        (
            rs.port_name.clone(),
            rs.baud_rate,
            rs.data_bits_number,
            rs.parity_string,
            rs.stop_bits_number,
        )
    };

    if port_name.is_empty() {
        return Err("No serial port configured".into());
    }
    if baud_rate == 0 {
        return Err("No baud rate configured".into());
    }

    let data_bits = map_data_bits(data_bits_number);
    let parity = map_parity(parity_string);
    let stop_bits = map_stop_bits(stop_bits_number);

    if MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
        MAIN_THREAD_SWITCH.store(true, Ordering::Relaxed);
        while MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }
    if SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
        SEND_THREAD_SWITCH.store(true, Ordering::Relaxed);
        while SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    let file = File::create(&file_path).map_err(|_| {
        MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);
        SEND_THREAD_SWITCH.store(false, Ordering::Relaxed);
        AppError::Other("Error creating file".into())
    })?;

    RECEIVE_THREAD_RUNNING.store(true, Ordering::Relaxed);
    SEND_THREAD_SWITCH.store(false, Ordering::Relaxed);
    MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);

    std::thread::spawn(move || {
        let mut file = file;
        let _ = app_handle.emit_all("rs232-status", "started");

        'main: loop {
            if RECEIVE_THREAD_SWITCH.load(Ordering::Relaxed) {
                break 'main;
            }

            let port = serialport::new(port_name.clone(), baud_rate)
                .data_bits(data_bits)
                .stop_bits(stop_bits)
                .parity(parity)
                .timeout(Duration::from_millis(10))
                .open();

            match port {
                Ok(mut port) => {
                    let _ = app_handle.emit_all("rs232-error-file", "");
                    let _ = app_handle.emit_all("rs232-file-send", "Ready to receive");
                    let mut serial_buf: Vec<u8> = vec![0; 1000];
                    let mut file_buf: Vec<u8> = Vec::new();
                    let mut file_buf_size: usize = 0;
                    let mut total_file_size: usize = 0;
                    let mut file_started = false;

                    'reading: loop {
                        if RECEIVE_THREAD_SWITCH.load(Ordering::Relaxed) {
                            break 'main;
                        }
                        match port.read(serial_buf.as_mut_slice()) {
                            Ok(t) => {
                                for elem in &serial_buf[..t] {
                                    if *elem == start_decimal {
                                        file_started = true;
                                        let _ = app_handle.emit_all("rs232-file-send", "Started reading");
                                    } else if *elem == stop_decimal && file_started {
                                        total_file_size += file_buf_size;
                                        let _ = file.write_all(&file_buf[..file_buf_size]);
                                        let _ = app_handle.emit_all("rs232-file-progress", format!("{}", total_file_size));
                                        let _ = app_handle.emit_all("rs232-file-send", "Finished file");
                                        break 'main;
                                    } else if file_started && !forbidden_decimals.contains(elem) {
                                        file_buf.insert(file_buf_size, *elem);
                                        file_buf_size += 1;
                                    }
                                }
                                if file_buf_size > 0 {
                                    total_file_size += file_buf_size;
                                    let _ = file.write_all(&file_buf[..file_buf_size]);
                                    file_buf.clear();
                                    file_buf_size = 0;
                                    let _ = app_handle.emit_all("rs232-file-progress", format!("{}", total_file_size));
                                }
                            }
                            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                            Err(_) => {
                                std::thread::sleep(Duration::from_millis(5));
                                break 'reading;
                            }
                        }
                    }
                }
                Err(_) => {
                    let _ = app_handle.emit_all("rs232-error-file", format!("Failed to open {}", port_name));
                    std::thread::sleep(Duration::from_millis(5));
                }
            }
        }

        RECEIVE_THREAD_RUNNING.store(false, Ordering::Relaxed);
        RECEIVE_THREAD_SWITCH.store(false, Ordering::Relaxed);
        let _ = app_handle.emit_all("rs232-status", "stopped");
    });

    Ok("Waiting for file...".into())
}

#[tauri::command(async)]
pub async fn start_file_send(
    file_path: String,
    send_in_pieces: u8,
    max_char: usize,
    delay: u64,
    listen_cnc: u8,
    stop_char: u8,
    restart_char: u8,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    if file_path.is_empty() {
        return Err("No file path specified".into());
    }

    let (port_name, baud_rate, data_bits_number, parity_string, stop_bits_number) = {
        let config = state.config.read().await;
        let rs = &config.exalise.rs232_settings;
        (
            rs.port_name.clone(),
            rs.baud_rate,
            rs.data_bits_number,
            rs.parity_string,
            rs.stop_bits_number,
        )
    };

    if port_name.is_empty() {
        return Err("No serial port configured".into());
    }
    if baud_rate == 0 {
        return Err("No baud rate configured".into());
    }

    let data_bits = map_data_bits(data_bits_number);
    let parity = map_parity(parity_string);
    let stop_bits = map_stop_bits(stop_bits_number);
    let file_path_copy = file_path.clone();

    if MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
        MAIN_THREAD_SWITCH.store(true, Ordering::Relaxed);
        while MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }
    if RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
        RECEIVE_THREAD_SWITCH.store(true, Ordering::Relaxed);
        while RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    let file = File::open(&file_path).map_err(|_| {
        MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);
        RECEIVE_THREAD_SWITCH.store(false, Ordering::Relaxed);
        AppError::Other("Error opening file".into())
    })?;

    SEND_THREAD_RUNNING.store(true, Ordering::Relaxed);
    RECEIVE_THREAD_SWITCH.store(false, Ordering::Relaxed);
    MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);

    std::thread::spawn(move || {
        let mut file = file;
        let mut total_bytes: usize = 0;
        let mut interval_bytes: usize = 0;

        let _ = app_handle.emit_all("rs232-status", "started");
        let _ = app_handle.emit_all("rs232-file-send", "Started transfer");

        'main: loop {
            if SEND_THREAD_SWITCH.load(Ordering::Relaxed) {
                break 'main;
            }

            let port = serialport::new(port_name.clone(), baud_rate)
                .data_bits(data_bits)
                .stop_bits(stop_bits)
                .parity(parity)
                .timeout(Duration::from_millis(10))
                .open();

            match port {
                Ok(mut port) => {
                    let _ = app_handle.emit_all("rs232-error-file", "");
                    let mut file_buf: Vec<u8> = vec![0; 10];
                    let mut serial_buf: Vec<u8> = vec![0; 10];
                    let mut stop = false;

                    'reading: loop {
                        if SEND_THREAD_SWITCH.load(Ordering::Relaxed) {
                            break 'main;
                        }

                        if send_in_pieces == 1 && interval_bytes >= max_char {
                            interval_bytes = 0;
                            std::thread::sleep(Duration::from_millis(delay));
                        }

                        if !stop {
                            match file.read(file_buf.as_mut_slice()) {
                                Ok(0) => {
                                    let _ = app_handle.emit_all("rs232-file-send", "Send completed");
                                    break 'main;
                                }
                                Ok(t) => match port.write(&file_buf[..t]) {
                                    Ok(written) => {
                                        total_bytes += written;
                                        interval_bytes += written;
                                        let file_size = file.metadata().map(|m| m.len()).unwrap_or(0);
                                        let _ = app_handle.emit_all(
                                            "rs232-file-progress",
                                            format!("{} / {}", total_bytes, file_size),
                                        );
                                    }
                                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                                    Err(_) => {
                                        let _ = app_handle.emit_all("rs232-error-file", format!("Failed to write to {}", port_name));
                                        break 'reading;
                                    }
                                },
                                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                                Err(_) => {
                                    let _ = app_handle.emit_all("rs232-error-file", format!("Failed to read file {}", file_path_copy));
                                    break 'main;
                                }
                            }
                        }

                        if listen_cnc == 1 {
                            match port.read(serial_buf.as_mut_slice()) {
                                Ok(t) => {
                                    for &elem in &serial_buf[..t] {
                                        if elem == stop_char {
                                            stop = true;
                                        } else if elem == restart_char {
                                            stop = false;
                                        }
                                    }
                                }
                                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                                Err(_) => {
                                    std::thread::sleep(Duration::from_millis(5));
                                    break 'reading;
                                }
                            }
                        }
                    }
                }
                Err(_) => {
                    let _ = app_handle.emit_all("rs232-error-file", format!("Failed to open {}", port_name));
                    std::thread::sleep(Duration::from_millis(5));
                }
            }
        }

        SEND_THREAD_RUNNING.store(false, Ordering::Relaxed);
        SEND_THREAD_SWITCH.store(false, Ordering::Relaxed);
        let _ = app_handle.emit_all("rs232-status", "stopped");
    });

    Ok("Starting file send...".into())
}
