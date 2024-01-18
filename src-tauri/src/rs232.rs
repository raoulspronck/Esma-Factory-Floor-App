use std::sync::atomic::{AtomicBool, Ordering};
use serialport::{DataBits, Parity, StopBits};
use std::fs;
use std::fs::File;
use std::io::Read;
use std::io::{self, Write};
use tokio::time::{sleep, Duration};
use tauri::State;
use tauri::Manager;

use crate::main_struct::ExaliseSettings;

pub static CONNECTED_TO_EXALISE: AtomicBool = AtomicBool::new(false);

pub static MAIN_THREAD_RUNNING: AtomicBool = AtomicBool::new(false);
pub static MAIN_THREAD_SWITCH: AtomicBool = AtomicBool::new(false);

pub static SEND_THREAD_RUNNING: AtomicBool = AtomicBool::new(false);
pub static SEND_THREAD_SWITCH: AtomicBool = AtomicBool::new(false);

pub static RECEIVE_THREAD_RUNNING: AtomicBool = AtomicBool::new(false);
pub static RECEIVE_THREAD_SWITCH: AtomicBool = AtomicBool::new(false);


#[tauri::command(async)]
pub async fn stop_file_receive(file_path: String) -> bool {
    if RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
        RECEIVE_THREAD_SWITCH.store(true, Ordering::Relaxed);
        // wait until thread is stopped;
        while RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    match fs::remove_file(file_path) {
        Ok(_s) => return true,
        Err(_e) => return false,
    }
}

#[tauri::command(async)]
pub async fn stop_file_send() -> bool {
    if SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
        SEND_THREAD_SWITCH.store(true, Ordering::Relaxed);
        // wait until thread is stopped;
        while SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }
    return true;
}


#[tauri::command(async)]
pub async fn start_file_receive(
    file_path: String,
    start_decimal: u8,
    stop_decimal: u8,
    forbidden_decimals: Vec<u8>,
    app_handle: tauri::AppHandle,
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, String> {
    if file_path == "" {
        return Err("Geen file path gespecificeerd".into());
    }

    let port_name = exalise_settings.rs232_settings.port_name.clone();
    let baud_rate = exalise_settings.rs232_settings.baud_rate.clone();
    let data_bits_number = exalise_settings.rs232_settings.data_bits_number.clone();
    let parity_string = exalise_settings.rs232_settings.parity_string.clone();
    let stop_bits_number = exalise_settings.rs232_settings.stop_bits_number.clone();

    if port_name == "" {
        return Err("Geen port name gespecificeerd".into());
    }

    if baud_rate == 0 {
        return Err("Geen baud rate gespecificeerd".into());
    }

    let data_bits;

    match data_bits_number {
        5 => data_bits = DataBits::Five,
        6 => data_bits = DataBits::Six,
        7 => data_bits = DataBits::Seven,
        8 => data_bits = DataBits::Eight,
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    let parity;

    match parity_string {
        0 => parity = Parity::None,
        1 => parity = Parity::Odd,
        2 => parity = Parity::Even,
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    let stop_bits;

    match stop_bits_number {
        0 => stop_bits = StopBits::One,
        1 => stop_bits = StopBits::Two,
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    if MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
        MAIN_THREAD_SWITCH.store(true, Ordering::Relaxed);
        // wait until thread is stopped;
        while MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    if SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
        SEND_THREAD_SWITCH.store(true, Ordering::Relaxed);
        // wait until thread is stopped;
        while SEND_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    let f = File::create(file_path);

    match f {
        Ok(mut file) => {
            RECEIVE_THREAD_RUNNING.store(true, Ordering::Relaxed);
            SEND_THREAD_SWITCH.store(false, Ordering::Relaxed);
            MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);
            std::thread::spawn(move || {
                app_handle.emit_all("rs232-status", "started").unwrap();
                
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
                            app_handle.emit_all("rs232-error-file", "").unwrap();
                            app_handle
                                .emit_all("rs232-file-send", "Ready to receive")
                                .unwrap();
                            let mut serial_buf: Vec<u8> = vec![0; 1000];
                            let mut file_buf: Vec<u8> = Vec::new();
                            let mut file_buf_size: usize = 0;
                            let mut total_file_size: usize = 0;

                            let mut file_started: bool = false;

                            'reading: loop {
                                if RECEIVE_THREAD_SWITCH.load(Ordering::Relaxed) {
                                    break 'main;
                                }
                                match port.read(serial_buf.as_mut_slice()) {
                                    Ok(t) => {
                                        for elem in &serial_buf[..t] {
                                            //print!("elem = {}  start = {}", *elem, start_decimal);

                                            if *elem == start_decimal {
                                                file_started = true;

                                                app_handle
                                                    .emit_all("rs232-file-send", "Started reading")
                                                    .unwrap();
                                            } else if *elem == stop_decimal && file_started {
                                                total_file_size += file_buf_size;
                                                file.write_all(&file_buf[..file_buf_size]).unwrap();
                                                app_handle
                                                    .emit_all(
                                                        "rs232-file-progress",
                                                        format!("{}", total_file_size),
                                                    )
                                                    .unwrap();

                                                app_handle
                                                    .emit_all("rs232-file-send", "Finished file")
                                                    .unwrap();
                                                break 'main;
                                            } else if file_started
                                                && !forbidden_decimals.contains(&*elem)
                                            {
                                                // file has started so we can begin reader -> everything except when it contains forbidden numbers
                                                file_buf.insert(file_buf_size, *elem);
                                                file_buf_size += 1;
                                            }
                                        }

                                        // if we got something to write to the file -> write it
                                        if file_buf_size > 0 {
                                            total_file_size += file_buf_size;
                                            file.write_all(&file_buf[..file_buf_size]).unwrap();
                                            file_buf = Vec::new();
                                            file_buf_size = 0;

                                            app_handle
                                                .emit_all(
                                                    "rs232-file-progress",
                                                    format!("{}", total_file_size),
                                                )
                                                .unwrap();
                                        }
                                    }
                                    Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
                                    Err(_e) => {
                                        std::thread::sleep(Duration::from_millis(5));
                                        break 'reading;
                                    }
                                }
                            }
                        }
                        Err(_e) => {
                            app_handle
                                .emit_all("rs232-error-file", format!("Failed to open {}", port_name))
                                .unwrap();
                            std::thread::sleep(Duration::from_millis(5));
                        }
                    }
                }
                RECEIVE_THREAD_RUNNING.store(false, Ordering::Relaxed);
                RECEIVE_THREAD_SWITCH.store(false, Ordering::Relaxed);
                app_handle.emit_all("rs232-status", "stopped").unwrap();
            });
            return Ok("Waiting for file...".into());
        }
        Err(_e) => {
            MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);
            SEND_THREAD_SWITCH.store(false, Ordering::Relaxed);
            return Err("Error creating file".into());
        }
    };
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
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, String> {
    if file_path == "" {
        return Err("Geen file path gespecificeerd".into());
    }

    let port_name = exalise_settings.rs232_settings.port_name.clone();
    let baud_rate = exalise_settings.rs232_settings.baud_rate.clone();
    let data_bits_number = exalise_settings.rs232_settings.data_bits_number.clone();
    let parity_string = exalise_settings.rs232_settings.parity_string.clone();
    let stop_bits_number = exalise_settings.rs232_settings.stop_bits_number.clone();

    if port_name == "" {
        return Err("Geen port name gespecificeerd".into());
    }

    if baud_rate == 0 {
        return Err("Geen baud rate gespecificeerd".into());
    }

    let data_bits;

    match data_bits_number {
        5 => data_bits = DataBits::Five,
        6 => data_bits = DataBits::Six,
        7 => data_bits = DataBits::Seven,
        8 => data_bits = DataBits::Eight,
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    let parity;

    match parity_string {
        0 => parity = Parity::None,
        1 => parity = Parity::Odd,
        2 => parity = Parity::Even,
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    let stop_bits;

    match stop_bits_number {
        0 => stop_bits = StopBits::One,
        1 => stop_bits = StopBits::Two,
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    let file_path_copy = file_path.clone();

    if MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
        MAIN_THREAD_SWITCH.store(true, Ordering::Relaxed);
        // wait until thread is stopped;
        while MAIN_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    if RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
        RECEIVE_THREAD_SWITCH.store(true, Ordering::Relaxed);
        // wait until thread is stopped;
        while RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed) {
            sleep(Duration::from_millis(100)).await;
        }
    }

    let f = File::open(file_path);
    let mut total_bytes: usize = 0;
    let mut interval_bytes: usize = 0;

    match f {
        Ok(mut file) => {
            SEND_THREAD_RUNNING.store(true, Ordering::Relaxed);
            RECEIVE_THREAD_SWITCH.store(false, Ordering::Relaxed);
            MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);
            std::thread::spawn(move || {
                app_handle.emit_all("rs232-status", "started").unwrap();
                app_handle
                    .emit_all("rs232-file-send", "Started transfer")
                    .unwrap();

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
                            app_handle.emit_all("rs232-error-file", "").unwrap();
                            let mut file_buf: Vec<u8> = vec![0; 10];
                            let mut serial_buf: Vec<u8> = vec![0; 10];
                            let mut stop: bool = false;

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
                                        Ok(t) => {
                                            if t == 0 {
                                                app_handle
                                                    .emit_all("rs232-file-send", "Send completed")
                                                    .unwrap();
                                                break 'main;
                                            } else {
                                                match port.write(&file_buf[..t]) {
                                                    Ok(t) => {
                                                        total_bytes += t;
                                                        interval_bytes += t;
                                                        app_handle
                                                            .emit_all(
                                                                "rs232-file-progress",
                                                                format!(
                                                                    "{} / {}",
                                                                    total_bytes,
                                                                    file.metadata().unwrap().len()
                                                                ),
                                                            )
                                                            .unwrap();
                                                    }
                                                    Err(ref e)
                                                        if e.kind() == io::ErrorKind::TimedOut =>
                                                    {
                                                        ()
                                                    }
                                                    Err(_e) => {
                                                        app_handle
                                                            .emit_all(
                                                                "rs232-error-file",
                                                                format!(
                                                                    "Failed to open {}",
                                                                    port_name
                                                                ),
                                                            )
                                                            .unwrap();
                                                        break 'reading;
                                                    }
                                                }
                                            }
                                        }
                                        Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
                                        Err(_e) => {
                                            app_handle
                                                .emit_all(
                                                    "rs232-error-file",
                                                    format!(
                                                        "Failed to read file {}",
                                                        file_path_copy
                                                    ),
                                                )
                                                .unwrap();
                                            break 'main;
                                        }
                                    }
                                }

                                if listen_cnc == 1 {
                                    match port.read(serial_buf.as_mut_slice()) {
                                        Ok(t) => {
                                            for elem in &serial_buf[..t] {
                                                if *elem == stop_char {
                                                    stop = true;
                                                } else if *elem == restart_char {
                                                    stop = false;
                                                }
                                            }
                                        }
                                        Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
                                        Err(_e) => {
                                            std::thread::sleep(Duration::from_millis(5));
                                            break 'reading;
                                        }
                                    }
                                }
                            }
                        }
                        Err(_e) => {
                            app_handle
                                .emit_all("rs232-error-file", format!("Failed to open {}", port_name))
                                .unwrap();
                            std::thread::sleep(Duration::from_millis(5));
                        }
                    }
                }
                SEND_THREAD_RUNNING.store(false, Ordering::Relaxed);
                SEND_THREAD_SWITCH.store(false, Ordering::Relaxed);
                app_handle.emit_all("rs232-status", "stopped").unwrap();
            });
            return Ok("Starting file sending...".into());
        }
        Err(_e) => {
            MAIN_THREAD_SWITCH.store(false, Ordering::Relaxed);
            RECEIVE_THREAD_SWITCH.store(false, Ordering::Relaxed);
            return Err("Error opening that file".into());
        }
    };
}

