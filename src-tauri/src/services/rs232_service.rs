use serialport::{DataBits, Parity, StopBits};
use serde_json::json;
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::time::{sleep, Duration};

// Thread-control flags shared between the RS232 service and the file-transfer commands.
pub static MAIN_THREAD_RUNNING: AtomicBool = AtomicBool::new(false);
pub static MAIN_THREAD_SWITCH: AtomicBool = AtomicBool::new(false);
pub static SEND_THREAD_RUNNING: AtomicBool = AtomicBool::new(false);
pub static SEND_THREAD_SWITCH: AtomicBool = AtomicBool::new(false);
pub static RECEIVE_THREAD_RUNNING: AtomicBool = AtomicBool::new(false);
pub static RECEIVE_THREAD_SWITCH: AtomicBool = AtomicBool::new(false);

pub fn map_data_bits(n: u32) -> DataBits {
    match n {
        5 => DataBits::Five,
        6 => DataBits::Six,
        7 => DataBits::Seven,
        _ => DataBits::Eight,
    }
}

pub fn map_parity(n: u32) -> Parity {
    match n {
        1 => Parity::Odd,
        2 => Parity::Even,
        _ => Parity::None,
    }
}

pub fn map_stop_bits(n: u32) -> StopBits {
    match n {
        2 => StopBits::Two,
        _ => StopBits::One,
    }
}

/// Spawns the perpetual RS232 monitoring task.
/// The task pauses itself when file-transfer threads take over the port.
pub fn start_rs232_monitor(
    mut port_name: String,
    mut baud_rate: u32,
    data_bits_number: u32,
    parity_string: u32,
    stop_bits_number: u32,
    device_key: String,
    mqtt_connected: Arc<AtomicBool>,
    window: tauri::Window,
) {
    if port_name.is_empty() {
        port_name = "COM3".to_string();
    }
    if baud_rate == 0 {
        baud_rate = 9600;
    }

    let data_bits = map_data_bits(data_bits_number);
    let parity = map_parity(parity_string);
    let stop_bits = map_stop_bits(stop_bits_number);

    tokio::task::spawn(async move {
        loop {
            // Wait for any active file transfer to finish before taking the port.
            while SEND_THREAD_RUNNING.load(Ordering::Relaxed)
                || RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed)
                || MAIN_THREAD_SWITCH.load(Ordering::Relaxed)
            {
                let _ = window.emit(
                    "rs232-error",
                    "RS232 monitoring waiting for file transfer to complete",
                );
                sleep(Duration::from_millis(1000)).await;
            }

            MAIN_THREAD_RUNNING.store(true, Ordering::Relaxed);
            let _ = window.emit("rs232-status", "started");

            'outer: loop {
                if MAIN_THREAD_SWITCH.load(Ordering::Relaxed) {
                    break 'outer;
                }

                let port = serialport::new(port_name.clone(), baud_rate)
                    .data_bits(data_bits)
                    .stop_bits(stop_bits)
                    .parity(parity)
                    .timeout(Duration::from_millis(10))
                    .open();

                match port {
                    Ok(mut port) => {
                        let _ = window.emit("rs232-error", "");
                        let mut serial_buf: Vec<u8> = vec![0; 1000];
                        let mut line_buf: Vec<u8> = Vec::new();
                        let mut buf_size: usize = 0;
                        let mut read_buf: Vec<u8> = Vec::new();
                        let mut read_buf_size: usize = 0;

                        'reading: loop {
                            if MAIN_THREAD_SWITCH.load(Ordering::Relaxed) {
                                break 'outer;
                            }
                            match port.read(serial_buf.as_mut_slice()) {
                                Ok(t) => {
                                    for elem in &serial_buf[..t] {
                                        read_buf.insert(read_buf_size, *elem);
                                        read_buf_size += 1;

                                        if *elem > 31 && *elem < 127 {
                                            line_buf.insert(buf_size, *elem);
                                            buf_size += 1;
                                        } else if *elem == 10 {
                                            if let Ok(v) = str::from_utf8(&line_buf[..buf_size]) {
                                                let split: Vec<&str> = v.split('-').collect();
                                                let decimal: String = read_buf[..read_buf_size]
                                                    .iter()
                                                    .map(|i| format!("{i:?} "))
                                                    .collect();

                                                let data = if split.len() == 2
                                                    && mqtt_connected.load(Ordering::Relaxed)
                                                {
                                                    json!({
                                                        "device": device_key,
                                                        "datapoint": split[0],
                                                        "value": split[1],
                                                        "message": v,
                                                        "decimal": decimal,
                                                    })
                                                } else {
                                                    json!({ "message": v, "decimal": decimal })
                                                };
                                                let _ = window.emit("rs232", data.to_string());
                                            } else {
                                                let _ = window
                                                    .emit("rs232-error", "Failed to read message");
                                            }
                                            line_buf.clear();
                                            buf_size = 0;
                                            read_buf.clear();
                                            read_buf_size = 0;
                                        } else if buf_size > 1000 {
                                            if let Ok(v) = str::from_utf8(&line_buf[..buf_size]) {
                                                let decimal: String = read_buf[..read_buf_size]
                                                    .iter()
                                                    .map(|i| format!("{i:?} "))
                                                    .collect();
                                                let _ = window.emit(
                                                    "rs232",
                                                    json!({ "message": v, "decimal": decimal })
                                                        .to_string(),
                                                );
                                            } else {
                                                let _ = window
                                                    .emit("rs232-error", "Failed to read message");
                                            }
                                            line_buf.clear();
                                            buf_size = 0;
                                            read_buf.clear();
                                            read_buf_size = 0;
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
                    Err(_) => {
                        let _ = window.emit("rs232-error", format!("Failed to open {}", port_name));
                        std::thread::sleep(Duration::from_millis(5));
                    }
                }
            }

            MAIN_THREAD_RUNNING.store(false, Ordering::Relaxed);
            let _ = window.emit("rs232-status", "stopped");
        }
    });
}
