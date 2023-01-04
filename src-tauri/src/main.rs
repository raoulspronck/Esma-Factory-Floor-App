#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs;
use std::fs::File;
use std::io::Read;
use std::io::{self, Write};
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use tauri::Manager;

use rumqttc::{Client, LastWill, MqttOptions, QoS};
use serialport::{available_ports, DataBits, Parity, StopBits};

use tauri_plugin_store::PluginBuilder;

static START_THREAD: AtomicBool = AtomicBool::new(false);
static CONNECTED_TO_EXALISE: AtomicBool = AtomicBool::new(false);

fn main() {
  tauri::Builder::default()
    .plugin(PluginBuilder::default().build())
    .invoke_handler(tauri::generate_handler![
      get_all_availble_ports,
      start_rs232,
      stop_rs232,
      start_file_receive,
      start_rs232_with_exalise,
      stop_file_receive,
      start_file_send
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn stop_rs232() {
  START_THREAD.store(false, Ordering::Relaxed);
}

#[tauri::command]
fn stop_file_receive(file_path: String) -> bool {
  START_THREAD.store(false, Ordering::Relaxed);

  match fs::remove_file(file_path) {
    Ok(_s) => return true,
    Err(_e) => return false,
  }
  // remove file
}

#[tauri::command]
fn start_rs232_with_exalise(
  port_name: String,
  baud_rate: u32,
  data_bits_number: u32,
  parity_string: u32,
  stop_bits_number: u32,
  mqtt_key: String,
  mqtt_secret: String,
  device_key: String,
  app_handle: tauri::AppHandle,
) -> Result<String, String> {
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

  if !START_THREAD.load(Ordering::Relaxed) {
    START_THREAD.store(true, Ordering::Relaxed);
    let device_key_clone = device_key.clone();

    std::thread::spawn(move || {
      // Create a client.
      let mut mqttoptions = MqttOptions::new(device_key, "mqtt.exalise.com", 1883);

      let will = LastWill::new(
        format!("exalise/lastwill/{}", device_key_clone),
        "disconnected",
        QoS::AtLeastOnce,
        false,
      );

      mqttoptions.set_last_will(will);
      mqttoptions.set_credentials(mqtt_key, mqtt_secret);
      mqttoptions.set_keep_alive(Duration::from_secs(5));
      let (mut client, mut connection) = Client::new(mqttoptions, 10);

      let mut client_clone = client.clone();
      let device_key_clone_clone = device_key_clone.clone();
      let app_handle_clone = app_handle.clone();

      std::thread::spawn(move || 'main: loop {
        if !START_THREAD.load(Ordering::Relaxed) {
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
            let mut serial_buf: Vec<u8> = vec![0; 1000];
            let mut buf_size: usize = 0;
            let mut line_buf: Vec<u8> = Vec::new();
            'reading: loop {
              if !START_THREAD.load(Ordering::Relaxed) {
                break 'main;
              }
              match port.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                  for elem in &serial_buf[..t] {
                    // enkel charackters invoegen die je kunt lezen
                    if *elem > 31 && *elem < 127 {
                      line_buf.insert(buf_size, *elem);
                      buf_size += 1;
                    } else if *elem == 10 {
                      print!("{:?}", &line_buf[..buf_size]);

                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          // split string
                          let split = v.split("-").collect::<Vec<&str>>();

                          if split.len() == 2 && CONNECTED_TO_EXALISE.load(Ordering::Relaxed) {
                            client
                              .publish(
                                format!("exalise/messages/{}/{}", device_key_clone, split[0]),
                                QoS::AtLeastOnce,
                                false,
                                split[1].as_bytes().to_vec(),
                              )
                              .unwrap();

                            app_handle
                              .emit_all(
                                "rs232",
                                format!(
                                  "Topic: exalise/messages/{}/{} Send: {}",
                                  device_key_clone, split[0], split[1]
                                ),
                              )
                              .unwrap();
                          }

                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
                    } else if buf_size > 1000 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          // split string
                          let split = v.split("-").collect::<Vec<&str>>();

                          if split.len() == 2 {
                            client
                              .publish(
                                format!("exalise/messages/{}/{}", device_key_clone, split[0]),
                                QoS::AtLeastOnce,
                                false,
                                split[1].as_bytes().to_vec(),
                              )
                              .unwrap();
                          }

                          app_handle
                            .emit_all(
                              "rs232",
                              format!(
                                "Topic: exalise/messages/{}/{} Send: {}",
                                device_key_clone, split[0], split[1]
                              ),
                            )
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
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
          Err(_e) => {
            app_handle
              .emit_all("rs232-error", format!("Failed to open {}", port_name))
              .unwrap();
            std::thread::sleep(Duration::from_millis(5));
          }
        }
      });

      for (_i, notification) in connection.iter().enumerate() {
        if !START_THREAD.load(Ordering::Relaxed) {
          break;
        }

        match notification {
          Ok(s) => {
            if !CONNECTED_TO_EXALISE.load(Ordering::Relaxed) {
              client_clone
                .publish(
                  format!("exalise/lastwill/{}", device_key_clone_clone),
                  QoS::AtLeastOnce,
                  false,
                  "connected".as_bytes().to_vec(),
                )
                .unwrap();

              CONNECTED_TO_EXALISE.store(true, Ordering::Relaxed);
            }
            println!("Succes Notification = {:?}", s);
            app_handle_clone
              .emit_all("exalise-connection", "Connected")
              .unwrap();
          }
          Err(e) => {
            if CONNECTED_TO_EXALISE.load(Ordering::Relaxed) {
              CONNECTED_TO_EXALISE.store(false, Ordering::Relaxed);
            }

            println!("Error Notification = {:?}", e);
            app_handle_clone
              .emit_all("exalise-connection", "Disconnected")
              .unwrap();
          }
        }
      }

      if CONNECTED_TO_EXALISE.load(Ordering::Relaxed) {
        client_clone.cancel().unwrap();

        CONNECTED_TO_EXALISE.store(false, Ordering::Relaxed);
      }
    });
    return Ok("Monitoring...".into());
  } else {
    return Err("Thread already started".into());
  }
}

#[tauri::command]
fn start_rs232(
  port_name: String,
  baud_rate: u32,
  data_bits_number: u32,
  parity_string: u32,
  stop_bits_number: u32,
  app_handle: tauri::AppHandle,
) -> Result<String, String> {
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

  if !START_THREAD.load(Ordering::Relaxed) {
    START_THREAD.store(true, Ordering::Relaxed);

    std::thread::spawn(move || {
      app_handle.emit_all("rs232-status", "started").unwrap();
      'main: loop {
        if !START_THREAD.load(Ordering::Relaxed) {
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
            let mut serial_buf: Vec<u8> = vec![0; 1000];
            let mut buf_size: usize = 0;
            let mut line_buf: Vec<u8> = Vec::new();
            'reading: loop {
              if !START_THREAD.load(Ordering::Relaxed) {
                break 'main;
              }
              match port.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                  for elem in &serial_buf[..t] {
                    line_buf.insert(buf_size, *elem);
                    buf_size += 1;
                    if *elem == 10 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          let output: String = line_buf[..buf_size]
                            .into_iter()
                            .map(|i| format!("{i:02x}"))
                            .collect();

                          app_handle
                            .emit_all("rs232", format!("{}/{}", v, output))
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
                    } else if buf_size > 1000 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          app_handle.emit_all("rs232", v).unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
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
          Err(_e) => {
            app_handle
              .emit_all("rs232-error", format!("Failed to open {}", port_name))
              .unwrap();
            std::thread::sleep(Duration::from_millis(5));
          }
        }

        app_handle.emit_all("rs232-status", "stopped").unwrap();
      }
    });
    return Ok("Monitoring...".into());
  } else {
    return Err("Thread already started".into());
  }
}

#[tauri::command]
fn start_file_receive(
  file_path: String,
  port_name: String,
  baud_rate: u32,
  data_bits_number: u32,
  parity_string: u32,
  stop_bits_number: u32,
  app_handle: tauri::AppHandle,
) -> Result<String, String> {
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

  if !START_THREAD.load(Ordering::Relaxed) {
    START_THREAD.store(true, Ordering::Relaxed);

    let mut file = File::create(file_path).unwrap();

    std::thread::spawn(move || 'main: loop {
      if !START_THREAD.load(Ordering::Relaxed) {
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
          let mut serial_buf: Vec<u8> = vec![0; 1000];
          let mut serial_buf_2: Vec<u8> = Vec::new();
          let mut serial_buf_size: usize = 0;
          let mut buf_size: usize = 0;
          let mut line_buf: Vec<u8> = Vec::new();
          let mut file_started: bool = false;
          'reading: loop {
            if !START_THREAD.load(Ordering::Relaxed) {
              break 'main;
            }
            match port.read(serial_buf.as_mut_slice()) {
              Ok(t) => {
                for elem in &serial_buf[..t] {
                  if *elem == 37 {
                    file_started = !file_started;
                  }

                  if *elem == 37 || file_started {
                    if *elem != 13 {
                      serial_buf_2.insert(serial_buf_size, *elem);
                      serial_buf_size += 1;
                    }
                    line_buf.insert(buf_size, *elem);
                    buf_size += 1;

                    if *elem == 10 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          app_handle.emit_all("rs232", v).unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
                    } else if buf_size > 1000 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          app_handle.emit_all("rs232", v).unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
                    }
                  }
                }

                file.write_all(&serial_buf_2[..serial_buf_size]).unwrap();
                serial_buf_2 = Vec::new();
                serial_buf_size = 0;
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
            .emit_all("rs232-error", format!("Failed to open {}", port_name))
            .unwrap();
          std::thread::sleep(Duration::from_millis(5));
        }
      }
    });
    return Ok("Waiting for file...".into());
  } else {
    return Err("Thread already started".into());
  }
}

#[tauri::command]
fn start_file_send(
  file_path: String,
  port_name: String,
  baud_rate: u32,
  data_bits_number: u32,
  parity_string: u32,
  stop_bits_number: u32,
  app_handle: tauri::AppHandle,
) -> Result<String, String> {
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

  if !START_THREAD.load(Ordering::Relaxed) {
    START_THREAD.store(true, Ordering::Relaxed);

    print!("{}", file_path_copy);

    let mut file = File::open(file_path).unwrap();

    std::thread::spawn(move || 'main: loop {
      if !START_THREAD.load(Ordering::Relaxed) {
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
          let mut file_buf: Vec<u8> = vec![0; 1000];
          let mut buf_size: usize = 0;
          let mut line_buf: Vec<u8> = Vec::new();

          'reading: loop {
            match file.read(file_buf.as_mut_slice()) {
              Ok(t) => match port.write(&file_buf[..t]) {
                Ok(t) => {
                  for elem in &file_buf[..t] {
                    line_buf.insert(buf_size, *elem);
                    buf_size += 1;
                    if *elem == 10 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          app_handle.emit_all("rs232", v).unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
                    } else if buf_size > 1000 {
                      match str::from_utf8(&line_buf[..buf_size]) {
                        Ok(v) => {
                          app_handle.emit_all("rs232", v).unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                        Err(_e) => {
                          app_handle
                            .emit_all("rs232-error", "Failed to read message")
                            .unwrap();
                          line_buf = Vec::new();
                          buf_size = 0;
                        }
                      };
                    }
                  }
                }
                Err(ref e) if e.kind() == io::ErrorKind::TimedOut => (),
                Err(_e) => {
                  app_handle
                    .emit_all("rs232-error", format!("Failed to open {}", port_name))
                    .unwrap();
                  break 'reading;
                }
              },
              Err(_e) => {
                app_handle
                  .emit_all(
                    "rs232-error",
                    format!("Failed to read file {}", file_path_copy),
                  )
                  .unwrap();
                break 'main;
              }
            }
          }
        }
        Err(_e) => {
          app_handle
            .emit_all("rs232-error", format!("Failed to open {}", port_name))
            .unwrap();
          std::thread::sleep(Duration::from_millis(5));
        }
      }
    });
    return Ok("Waiting for file...".into());
  } else {
    return Err("Thread already started".into());
  }
}

#[tauri::command]
fn get_all_availble_ports() -> Result<std::vec::Vec<String>, String> {
  match available_ports() {
    Ok(ports) => {
      let mut elements = vec![];
      let index = 0;
      for p in ports {
        elements.insert(index, p.port_name);
      }

      return Ok(elements);
    }
    Err(_e) => return Err("Error listing serial ports".to_string()),
  }
}
