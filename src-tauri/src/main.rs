#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod main_struct;
mod rs232;

use crate::main_struct::{
    Alert, Alerts, ApiSettings, Dashboard, Debiteur, Device, ExaliseHttpSettings,
    ExaliseMqttSettings, ExaliseSettings, LastValueStore, LastValueStoreItem, Layout, LoginData,
    RS232Settings, BasicSettings
};
use crate::rs232::{
   start_file_receive, start_file_send, stop_file_receive, stop_file_send,
    CONNECTED_TO_EXALISE,
};

use rs232::{MAIN_THREAD_SWITCH, RECEIVE_THREAD_RUNNING, SEND_THREAD_RUNNING, MAIN_THREAD_RUNNING};
use rumqttc::{AsyncClient, ConnAck, ConnectReturnCode, Event, LastWill, MqttOptions, Packet, QoS};
use serde_json::{Value, json};
use serde_urlencoded;
use serialport::{available_ports, DataBits, Parity, StopBits};
use std::fs::OpenOptions;
use std::io::Write;
use std::str;
use std::sync::atomic::Ordering;
use tauri::api::process::{Command, CommandEvent};
use tauri::Manager;
use tauri::State;
use tokio::sync::Mutex;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use tauri_plugin_autostart::MacosLauncher;
use chrono::prelude::*;

pub struct MqttClient(Mutex<AsyncClient>);

pub struct BearerToken(String);

async fn find_and_update_or_insert_item_by_key(
    last_value_store_mutex: State<'_, RwLock<LastValueStore>>,
    key_to_find: &str,
    new_value: &str,
) {

    let mut last_value_store_write = last_value_store_mutex.write().await;
    let mut found = false;
    

    for item in &mut last_value_store_write.lastvaluestoreitem {
        if item.key == key_to_find {
            item.value = new_value.to_string();
            found = true;
            break;
        }
    }

    if !found {
        // If the key was not found, add a new entry
        last_value_store_write
            .lastvaluestoreitem
            .push(LastValueStoreItem {
                key: key_to_find.to_string(),
                value: new_value.to_string(),
            });
    }
}

async fn get_value_by_key(
    last_value_store_mutex: State<'_, RwLock<LastValueStore>>,
    key_to_find: &str,
) -> Option<String> {
    let last_value_store_read = last_value_store_mutex.read().await;

    for item in &last_value_store_read.lastvaluestoreitem {
        if item.key == key_to_find {
            return Some(item.value.clone());
        }
    }
    None
}


#[tokio::main]
async fn main() {
    //create a log file

    if !std::path::Path::new(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/logs.txt",
    )
    .exists()
    {
        std::fs::File::create(
            "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/logs.txt",
        )
        .unwrap();
    }

    // Some JSON input data as a &str. Maybe this comes from the user.
    let default_basic_settings_string = r#"
    {
        "gesture_control": "False",
        "automatic_load_dashboard": "True"
    }"#;

    // Parse the string of data into serde_json::Value.
    let default_basic_settings_json: BasicSettings = serde_json::from_str(default_basic_settings_string).unwrap();

    let file_open = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/basic.settings.json",
    );

    let basic_settings: BasicSettings;

    match file_open {
        Ok(v) => {
            let res = serde_json::from_str::<BasicSettings>(&v);

            match res {
                Ok(r) => {
                    basic_settings = r;
                }
                Err(_err) => {
                    // save file with new settings
                    // Save the JSON structure into the other file.
                    std::fs::write(
                        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/basic.settings.json",
                        serde_json::to_string_pretty(&default_basic_settings_json).unwrap(),
                    )
                    .unwrap();
                     basic_settings = default_basic_settings_json;
                }
            }
        }
        Err(_e) => {
            // save file with new settings
            // Save the JSON structure into the other file.
            std::fs::write(
                "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/basic.settings.json",
                serde_json::to_string_pretty(&default_basic_settings_json).unwrap(),
            )
            .unwrap();
            basic_settings = default_basic_settings_json;
        }
    }

    // Some JSON input data as a &str. Maybe this comes from the user.
    let default_api_string = r#"
    {
        "username": "",
        "password": ""    
    }"#;

    // Parse the string of data into serde_json::Value.
    let default_api_json: ApiSettings = serde_json::from_str(default_api_string).unwrap();

    let file_open = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/api.settings.json",
    );

    let api_settings: ApiSettings;

    match file_open {
        Ok(v) => {
            let res = serde_json::from_str::<ApiSettings>(&v);

            match res {
                Ok(r) => {
                    api_settings = r;
                }
                Err(_err) => {
                    // save file with new settings
                    // Save the JSON structure into the other file.
                    std::fs::write(
                        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/api.settings.json",
                        serde_json::to_string_pretty(&default_api_json).unwrap(),
                    )
                    .unwrap();
                    api_settings = default_api_json;
                }
            }
        }
        Err(_e) => {
            // save file with new settings
            // Save the JSON structure into the other file.
            std::fs::write(
                "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/api.settings.json",
                serde_json::to_string_pretty(&default_api_json).unwrap(),
            )
            .unwrap();
            api_settings = default_api_json;
        }
    }

    // Some JSON input data as a &str. Maybe this comes from the user.
    let default_alerts_string = r#"
    {
        "alerts": []    
    }"#;

    // Parse the string of data into serde_json::Value.
    let default_alerts_json: Alerts = serde_json::from_str(default_alerts_string).unwrap();

    let file_open = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/alerts.exalise.json",
    );

    match file_open {
        Ok(v) => {
            let res = serde_json::from_str::<Alerts>(&v);

            match res {
                Ok(_r) => {}
                Err(_err) => {
                    // save file with new settings
                    // Save the JSON structure into the other file.
                    std::fs::write(
                        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/alerts.exalise.json",
                        serde_json::to_string_pretty(&default_alerts_json).unwrap(),
                    )
                    .unwrap();
                }
            }
        }
        Err(_e) => {
            // save file with new settings
            // Save the JSON structure into the other file.
            std::fs::write(
                "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/alerts.exalise.json",
                serde_json::to_string_pretty(&default_alerts_json).unwrap(),
            )
            .unwrap();
        }
    }

    
    

    // Some JSON input data as a &str. Maybe this comes from the user.
    let default_dashboard_string = r#"
        {
            "layout": [],
            "devices": []
        }"#;

    // Parse the string of data into serde_json::Value.
    let mut default_dashboard_json: Dashboard = serde_json::from_str(default_dashboard_string).unwrap();

    let http_client = reqwest::Client::new();

    if basic_settings.automatic_load_dashboard == "True" {
        // Load default dashboard gist
        let response = http_client
            .get("https://gist.githubusercontent.com/raoulspronck/60df74173b8ff477eb5af601f8007f59/raw")
            .send()
            .await
            .unwrap()
            .text()
            .await;

        match response {
            Ok(res) => {
                default_dashboard_json = serde_json::from_str(&*res).unwrap();
            }
            Err(_err) => {}
        };

        let file_open = std::fs::read_to_string(
            &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
        );
    
        match file_open {
            Ok(v) => {
                let res = serde_json::from_str::<Dashboard>(&v);
    
                match res {
                    Ok(_r) => {
                        // Always save default dashboard
                        std::fs::write(
                            "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
                            serde_json::to_string_pretty(&default_dashboard_json).unwrap(),
                        )
                        .unwrap();
                    }
                    Err(_err) => {
                        // save file with new settings
                        // Save the JSON structure into the other file.
                        std::fs::write(
                            "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
                            serde_json::to_string_pretty(&default_dashboard_json).unwrap(),
                        )
                        .unwrap();
                    }
                }
            }
            Err(_e) => {
                // save file with new settings
                // Save the JSON structure into the other file.
                std::fs::write(
                    "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
                    serde_json::to_string_pretty(&default_dashboard_json).unwrap(),
                )
                .unwrap();
            }
        }
    } else {
        let file_open = std::fs::read_to_string(
            &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
        );
    
        match file_open {
            Ok(v) => {
                let res = serde_json::from_str::<Dashboard>(&v);
    
                match res {
                    Ok(_r) => {
                        
                    }
                    Err(_err) => {
                        // save file with new settings
                        // Save the JSON structure into the other file.
                        std::fs::write(
                            "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
                            serde_json::to_string_pretty(&default_dashboard_json).unwrap(),
                        )
                        .unwrap();
                    }
                }
            }
            Err(_e) => {
                // save file with new settings
                // Save the JSON structure into the other file.
                std::fs::write(
                    "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
                    serde_json::to_string_pretty(&default_dashboard_json).unwrap(),
                )
                .unwrap();
            }
        }
    
    }
    

   
    // Some JSON input data as a &str. Maybe this comes from the user.
    let default_settings_string = r#"
        {
            "mqtt_settings": {
                "mqtt_key": "mqtt_key",
                "mqtt_secret": "mqtt_secret",
                "device_key": "device_key"
            },
            "http_settings": {
                "http_key": "http_key",
                "http_secret": "http_secret"
            },
            "rs232_settings": {
                "port_name": "",
                "baud_rate": 9600,
                "data_bits_number": 8,
                "parity_string": 0,
                "stop_bits_number": 1
            }
        }"#;

    // Parse the string of data into serde_json::Value.
    let default_settings_json: ExaliseSettings =
        serde_json::from_str(default_settings_string).unwrap();

    let exalise_settings: ExaliseSettings;

    let file_open = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
    );

    match file_open {
        Ok(v) => {
            let res = serde_json::from_str::<ExaliseSettings>(&v);

            match res {
                Ok(r) => {
                    exalise_settings = r;
                }
                Err(_err) => {
                    exalise_settings = default_settings_json;
                    // save file with new settings
                    // Save the JSON structure into the other file.
                    std::fs::write(
                        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
                        serde_json::to_string_pretty(&exalise_settings).unwrap(),
                    )
                    .unwrap();
                }
            }
        }
        Err(_e) => {
            exalise_settings = default_settings_json;
            // save file with new settings
            // Save the JSON structure into the other file.
            std::fs::write(
                "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
                serde_json::to_string_pretty(&exalise_settings).unwrap(),
            )
            .unwrap();
        }
    }

    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let device_key_lastwill = device_key.clone();

    let mqtt_key = exalise_settings.mqtt_settings.mqtt_key.clone();
    let mqtt_secret = exalise_settings.mqtt_settings.mqtt_secret.clone();

    let port_name = exalise_settings.rs232_settings.port_name.clone();
    let baud_rate = exalise_settings.rs232_settings.baud_rate.clone();
    let data_bits_number = exalise_settings.rs232_settings.data_bits_number.clone();
    let parity_string = exalise_settings.rs232_settings.parity_string.clone();
    let stop_bits_number = exalise_settings.rs232_settings.stop_bits_number.clone();

    //connect to mqtt broker
    let broker_url = "mqtt.exalise.com";
    let broker_port = 1883;

    let mut mqttoptions = MqttOptions::new(device_key, broker_url, broker_port);

    let will = LastWill::new(
        format!("exalise/lastwill/{}", device_key_lastwill),
        "disconnected",
        QoS::AtLeastOnce,
        false,
    );

    mqttoptions.set_last_will(will);
    mqttoptions.set_credentials(mqtt_key, mqtt_secret);
    mqttoptions.set_keep_alive(Duration::from_secs(5));
    mqttoptions.set_clean_session(false);

    let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);

    let client_clone = client.clone();
    let device_key_clone = device_key_lastwill.clone();
    let device_key_clone_clone = device_key_lastwill.clone();
    let device_key_clone_clone_clone = device_key_lastwill.clone();
    let device_key_clone_clone_clone_clone = device_key_lastwill.clone();

    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();
    let response = http_client
        .get("https://api.exalise.com/api/getisdayoff")
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key_clone_clone_clone)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => {
            if res == "True" {
                // Shutdown computer
                if cfg!(target_os = "windows") {
                    // Windows
                    Command::new("shutdown")
                        .args(&["/s", "/t", "0"])
                        .output()
                        .expect("Failed to shut down the computer");
                } else if cfg!(target_os = "linux") {
                    // Linux
                    Command::new("shutdown")
                        .args(&["-h", "now"])
                        .output()
                        .expect("Failed to shut down the computer");
                } else if cfg!(target_os = "macos") {
                    // macOS
                    Command::new("shutdown")
                        .args(&["-h", "now"])
                        .output()
                        .expect("Failed to shut down the computer");
                }
                
            }
        },
        Err(err) => println!("{}" ,err),
    }
   

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!("")) /* arbitrary number of args to pass to your app */))
        .manage(MqttClient(Mutex::new(client_clone)))
        .manage(BearerToken("".into()))
        .manage(RwLock::new(LastValueStore {
            lastvaluestoreitem: Vec::new(),
        }))
        .manage(exalise_settings)
        .manage(api_settings)
        .setup(move |app| {
            // Run gesture control binary
            //if basic_settings.gesture_control == "True" {
            //}

            let resource_path = app
            .path_resolver()
            .resolve_resource("binarieresources/light_control.task")
            .expect("failed to resolve resource");

            let _window = app.get_window("main").unwrap();
            let client_clone = client.clone();

            tauri::async_runtime::spawn(async move {
                loop {
                    let (mut rx, _child) = Command::new_sidecar("main")
                    .expect("failed to setup `app` sidecar")
                    .args([format!("{:?}", &resource_path)])
                    .spawn()
                    .expect("Failed to spawn packaged node");

                    while let Some(event) = rx.recv().await {
                        if let CommandEvent::Stdout(line) = event {
                            let output = line.replace("\r", "").replace("\n", "");

                            client_clone
                                    .publish(
                                        format!("exalise/messages/{}/Light", device_key_clone_clone_clone_clone),
                                        QoS::AtLeastOnce,
                                        false,
                                        output.as_bytes().to_vec(),
                                    )
                                    .await
                                    .unwrap();
                        }
                    }

                    // sleep 5 minutes
                    sleep(Duration::from_secs(60)).await;              }
            });
         
            

            // Run mqtt logic
            let main_window = app.get_window("main").unwrap();
            let main_window_2 = main_window.clone();

            let app_handler = app.handle();

            // Start up rs232 communication
            automatic_start_rs232(
                port_name,
                baud_rate,
                data_bits_number,
                parity_string,
                stop_bits_number,
                device_key_clone_clone,
                main_window_2
            );

            tauri::async_runtime::spawn(async move {
                

                // receive incoming notifications
                let mut connected = false;
                loop {
                    let last_value_store = app_handler.state::<RwLock<LastValueStore>>();

                    let notification = eventloop.poll().await;

                    let time: String = Local::now().to_string();
                    
                    match notification {
                        Ok(s) => {
                            main_window.emit("exalise-connection-status", format!("{} - {:?}", time, s)).unwrap();
                            if !connected {
                                CONNECTED_TO_EXALISE.store(true, Ordering::Relaxed);

                                main_window.emit("exalise-connection", "connected").unwrap();

                                client
                                    .publish(
                                        format!("exalise/lastwill/{}", device_key_clone),
                                        QoS::AtLeastOnce,
                                        false,
                                        "connected".as_bytes().to_vec(),
                                    )
                                    .await
                                    .unwrap();
                                connected = true;
                            }

                            if let Event::Incoming(Packet::PingResp) = s {
                                main_window.emit("Ping", "check").unwrap();
                            }

                            if let Event::Incoming(Packet::ConnAck(ConnAck {
                                session_present: _,
                                code,
                            })) = s
                            {
                                if let ConnectReturnCode::Success = code {
                                    client
                                        .subscribe("exalise/messages/#", QoS::AtMostOnce)
                                        .await
                                        .unwrap();
                                    client
                                        .subscribe("exalise/lastwill/#", QoS::AtMostOnce)
                                        .await
                                        .unwrap();
                                }
                            }

                            if let Event::Incoming(Packet::Publish(p)) = s {
                                let payload = str::from_utf8(p.payload.as_ref())
                                    .expect("Error converting payload to string");

                                let topic = p.topic;
                                let topic_split = topic.split("/");

                                let vec_topic: Vec<&str> = topic_split.collect();

                                if vec_topic[1] == "messages" {
                                    if vec_topic.len() == 3 {
                                        let s: String =
                                            format!("notification---{}", vec_topic[2]).to_owned();
                                        let s_slice: &str = &s[..];

                                        main_window.emit(s_slice, format!("{}", payload)).unwrap();

                                        let key_to_find = vec_topic[2];
                                        let new_value = payload;


                                        // Find and update the item with the specified key, or insert a new entry
                                        find_and_update_or_insert_item_by_key(
                                            last_value_store,
                                            key_to_find,
                                            new_value,
                                        )
                                        .await;
                                    } else {

                                        // remove key from topic
                                        let datapoint_key_split = vec_topic[3].split("_");

                                        let datapoint_key: Vec<&str> =
                                            datapoint_key_split.collect();

                                        let device_key = vec_topic[2];

                                        if device_key == device_key_clone && datapoint_key[0] == "Shutdown" {
                                            if cfg!(target_os = "windows") {
                                                // Windows
                                                Command::new("shutdown")
                                                    .args(&["/s", "/t", "0"])
                                                    .output()
                                                    .expect("Failed to shut down the computer");
                                            } else if cfg!(target_os = "linux") {
                                                // Linux
                                                Command::new("shutdown")
                                                    .args(&["-h", "now"])
                                                    .output()
                                                    .expect("Failed to shut down the computer");
                                            } else if cfg!(target_os = "macos") {
                                                // macOS
                                                Command::new("shutdown")
                                                    .args(&["-h", "now"])
                                                    .output()
                                                    .expect("Failed to shut down the computer");
                                            }
                                            continue
                                        }

                                        let key_to_find =
                                            format!("{}---{}", device_key, datapoint_key[0]);

                                        let s: String =
                                            format!("notification---{}", key_to_find).to_owned();


                                        let s_slice: &str = &s[..];
                                    

                                        main_window.emit(s_slice, format!("{}", payload)).unwrap();

                                        let new_value = payload;
                                        let key_to_find_str = key_to_find.as_str();

                                        // Find and update the item with the specified key, or insert a new entry
                                        find_and_update_or_insert_item_by_key(
                                            last_value_store,
                                            key_to_find_str,
                                            new_value,
                                        )
                                        .await;
                                    }
                                } else if vec_topic[1] == "lastwill" {
                                    let s: String =
                                        format!("notification---{}", vec_topic[2]).to_owned();
                                    let s_slice: &str = &s[..];

                                    main_window.emit(s_slice, format!("{}", payload)).unwrap();
                                }
                            }
                        }
                        Err(e) => {
                            main_window.emit("exalise-connection-status", format!("{:?}", e)).unwrap();
                            if connected {
                                CONNECTED_TO_EXALISE.store(false, Ordering::Relaxed);
                                main_window
                                    .emit("exalise-connection", "disconnected")
                                    .unwrap();
                                connected = false;
                            }
                        }
                    }
                }
            });

            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_all_availble_ports,
            start_file_receive,
            stop_file_receive,
            start_file_send,
            stop_file_send,
            save_exalise_mqtt_settings,
            save_exalise_http_settings,
            get_exalise_settings,
            get_exalise_connection,
            get_devices,
            get_device,
            get_dashboard,
            save_device_to_dashboard,
            save_widget_to_dashboard,
            get_last_value,
            save_dashboard_layout,
            get_pdf_file,
            save_rs232_settings,
            save_alerts,
            get_alerts,
            get_debiteuren,
            save_api_settings,
            get_api_settings,
            close_splashscreen,
            write_to_log_file,
            send_message,
            get_basic_settings,
            save_basic_settings,
            get_own_device,
            get_quiz,
            get_question,
            get_end_answer,
            post_remove_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


fn automatic_start_rs232(
    mut port_name: String,
    mut baud_rate: u32,
    data_bits_number: u32,
    parity_string: u32,
    stop_bits_number: u32,
    device_key: String,
    window: tauri::Window,
) {
    if port_name == "" {
        port_name = "COM3".to_string();
    }

    if baud_rate == 0 {
        baud_rate = 9600;
    }

    let data_bits;

    match data_bits_number {
        5 => data_bits = DataBits::Five,
        6 => data_bits = DataBits::Six,
        7 => data_bits = DataBits::Seven,
        8 => data_bits = DataBits::Eight,
        _ => data_bits = DataBits::Eight,
    }

    let parity;

    match parity_string {
        0 => parity = Parity::None,
        1 => parity = Parity::Odd,
        2 => parity = Parity::Even,
        _ => parity = Parity::None,
    }

    let stop_bits;

    match stop_bits_number {
        1 => stop_bits = StopBits::One,
        2 => stop_bits = StopBits::Two,
        _ => stop_bits = StopBits::One,
    }


    tokio::task::spawn(async move {
        loop {
            // if file sending is in progress -> wait
            while SEND_THREAD_RUNNING.load(Ordering::Relaxed)
                || RECEIVE_THREAD_RUNNING.load(Ordering::Relaxed)
                || MAIN_THREAD_SWITCH.load(Ordering::Relaxed)
            {
                window
                .emit("rs232-error", "RS232 Monitoring waiting for file transfer to be completed")
                .unwrap();
                sleep(Duration::from_millis(1000)).await;
            }

            //set main thread running
            MAIN_THREAD_RUNNING.store(true, Ordering::Relaxed);
            window.emit("rs232-status", "started").unwrap();

            'main: loop {
                if MAIN_THREAD_SWITCH.load(Ordering::Relaxed) {
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
                        window.emit("rs232-error", "").unwrap();
                        let mut serial_buf: Vec<u8> = vec![0; 1000];
                        let mut line_buf: Vec<u8> = Vec::new();
                        let mut buf_size: usize = 0;
                        let mut read_buf: Vec<u8> = Vec::new();
                        let mut read_buf_size: usize = 0;
                        'reading: loop {
                            if MAIN_THREAD_SWITCH.load(Ordering::Relaxed) {
                                break 'main;
                            }
                            match port.read(serial_buf.as_mut_slice()) {
                                Ok(t) => {
                                    for elem in &serial_buf[..t] {
                                        read_buf.insert(read_buf_size, *elem);
                                        read_buf_size += 1;
                                        // enkel charackters invoegen die je kunt lezen
                                        if *elem > 31 && *elem < 127 {
                                            line_buf.insert(buf_size, *elem);
                                            buf_size += 1;
                                        } else if *elem == 10 {
                                            match str::from_utf8(&line_buf[..buf_size]) {
                                                Ok(v) => {
                                                    // split string
                                                    let split = v.split("-").collect::<Vec<&str>>();
                                                    if split.len() == 2
                                                        && CONNECTED_TO_EXALISE
                                                            .load(Ordering::Relaxed)
                                                    {
                                                        let decimal: String = read_buf
                                                            [..read_buf_size]
                                                            .into_iter()
                                                            .map(|i| format!("{i:?} "))
                                                            .collect();
                                                        let data = json!({
                                                            "device": device_key ,
                                                            "datapoint": split[0].to_string(),
                                                            "value": split[1].to_string(),
                                                            "message": v,
                                                            "decimal": decimal,
                                                        });
                                                        window
                                                            .emit("rs232", data.to_string())
                                                            .unwrap();
                                                        line_buf = Vec::new();
                                                        buf_size = 0;
                                                        read_buf = Vec::new();
                                                        read_buf_size = 0;
                                                    } else {
                                                        let decimal: String = read_buf
                                                                    [..read_buf_size]
                                                                    .into_iter()
                                                                    .map(|i| format!("{i:?} "))
                                                                    .collect();
                                                                let data = json!({
                                                                    "message": v,
                                                                    "decimal": decimal,
                                                                });
                                                        window
                                                            .emit("rs232", data.to_string())
                                                            .unwrap();
                                                        line_buf = Vec::new();
                                                        buf_size = 0;
                                                        read_buf = Vec::new();
                                                        read_buf_size = 0;
                                                    }
                                                }
                                                Err(_e) => {
                                                    window
                                                        .emit(
                                                            "rs232-error",
                                                            "Failed to read message",
                                                        )
                                                        .unwrap();
                                                    line_buf = Vec::new();
                                                    buf_size = 0;
                                                    read_buf = Vec::new();
                                                    read_buf_size = 0;
                                                }
                                            };
                                        } else if buf_size > 1000 {
                                            match str::from_utf8(&line_buf[..buf_size]) {
                                                Ok(v) => {
                                                    let decimal: String = read_buf[..read_buf_size]
                                                        .into_iter()
                                                        .map(|i| format!("{i:?} "))
                                                        .collect();
                                                    let data = json!({
                                                        "message": v,
                                                        "decimal": decimal,
                                                    });
                                                    window.emit("rs232", data.to_string()).unwrap();
                                                    line_buf = Vec::new();
                                                    buf_size = 0;
                                                    read_buf = Vec::new();
                                                    read_buf_size = 0;
                                                }
                                                Err(_e) => {
                                                    window
                                                        .emit_all(
                                                            "rs232-error",
                                                            "Failed to read message",
                                                        )
                                                        .unwrap();
                                                    line_buf = Vec::new();
                                                    buf_size = 0;
                                                    read_buf = Vec::new();
                                                    read_buf_size = 0;
                                                }
                                            };
                                        }
                                    }
                                }
                                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => (),
                                Err(_e) => {
                                    
                                    std::thread::sleep(Duration::from_millis(5));
                                    break 'reading;
                                }
                            }
                        }
                    }
                    Err(_e) => {
                        window
                            .emit("rs232-error", format!("Failed to open {}", port_name))
                            .unwrap();
                        std::thread::sleep(Duration::from_millis(5));
                    }
                }
            }

            //if broken out -> set main thread running false
            MAIN_THREAD_RUNNING.store(false, Ordering::Relaxed);
            window.emit("rs232-status", "stopped").unwrap();
        }
    });
}



#[tauri::command(async)]
async fn send_message(
    device_key: String,
    datapoint: String,
    value: String,
    mqtt_client: State<'_, MqttClient>,
) -> Result<bool, bool> {
    let client = mqtt_client.0.lock().await;

    match client
        .publish(
            format!("exalise/messages/{}/{}", device_key, datapoint),
            QoS::AtLeastOnce,
            false,
            value.as_bytes().to_vec(),
        )
        .await
    {
        Ok(_ok) => {
            return Ok(true);
        }
        Err(_err) => {
            return Err(false);
        }
    }
}

#[tauri::command(async)]
async fn close_splashscreen(window: tauri::Window) {
    // Close splashscreen
    if let Some(splashscreen) = window.get_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    // Show main window
    window.get_window("main").unwrap().show().unwrap();
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

async fn get_bearer_token(username: String, password: String) -> String {
    let data = LoginData {
        grant_type: "password".into(),
        username: username.into(),
        password: password.into(),
    };
    let data = serde_urlencoded::to_string(&data).expect("serialize issue");

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .unwrap();
    let response = client
        .post("https://app.esma.be:4430/Token")
        .header("Accept", "*/*")
        .header("X-Requested-With", "XMLHttpRequest")
        .header("Referer", "https://app.esma.be:4430/")
        .body(data)
        .send()
        .await
        .unwrap()
        .text()
        .await;
    match response {
        Ok(res) => {
            let value: Value = serde_json::from_str(&*res).unwrap();

            // Check if the object has a specific key-value pair
            if let Some(val) = value.get("access_token") {
                if val.is_string() {
                    return value["access_token"].as_str().unwrap().to_string();
                } else {
                    // The object has the key-value pair
                    //println!("Accestoken is empty");
                    return "".into();
                }
            } else {
                // The object doesn't have the key
                //println!("The object doesn't contain the key");
                return "".into();
            }
        }
        Err(_err) => {
            //println!("err = {:?}", err);
            return "".into();
        }
    }
}

#[tauri::command(async)]
async fn get_debiteuren(
    take: usize,
    skip: usize,
    _productie_order: String,
    api_setttings: State<'_, ApiSettings>,
    bearer_token: State<'_, BearerToken>,
) -> Result<String, String> {
    let mut token = bearer_token.0.clone();
    if token.is_empty() {
        let res = get_bearer_token(
            api_setttings.username.clone(),
            api_setttings.password.clone(),
        )
        .await;

        if res.is_empty() {
            return Err("Access denied".into());
        }
        token = res;
    }

    //token = "DECNSJGmLoW2iVgU9DQsY0rs0Hpr7fSplnROu0E3eR7phWa2cJHr3YbJBLmuwmX_2rhOvnEBSvDimroVy_rCf4SVfVHSwIdUjyUqizujHfDhBCmc1zuDnussQW7fjOs0I-OzoLkdEGL-Sr4_sh2O6zk9GW575lkxQlWwDFXWxDD7sqY-MBfyLWvD_Hdm3gb-M_m7tUEv94v-MJlbRvboFaRZSKtOzy3AY0qBXcYMyiGfaqrZmJKzeIrrrPKHSJCvU6qBkvUd-IUO4OpZh-urKoEU_D6qHug2eXPwqhIjPnhWHcKbPsTWMgimNYVHUPtOf1Tmi2eE7Glen9JHWQgLUwF2QcnCe919IbppCtRFneZirXiPgefkCeB7zaJfOBANoC2__YC2zrEO6pOMIkGOelkQzUS9ZQwtmqnsOZgJ3PcNU9ex3C80Ug1RWCaRIb4tYwzM_84XHT32JtXw1OZs-RN9LgTFVfgcP366zvmxr3xIxT4p-uyO_d4ZlehE_BuzJS-QyhyT1mjCwb4lS99wlIob_PO4y2IkxlW1igXD-WI".into();

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .unwrap();

    let req = client
        .get("https://app.esma.be:4430/api/Debiteur")
        .header("Accept", "*/*")
        .header("Authorization", format!("Bearer {}", token));

    let response = req.send().await.unwrap();

    let status = response.status();

    // if response is 200 -> parse result
    if status == 200 {
        let response2 = response.text().await;
        match response2 {
            Ok(res) => {
                // convert res into &str
                let res_slice: &str = &res[..];

                // parse result
                let debiteuren: Vec<Debiteur> = serde_json::from_str(res_slice).unwrap();

                // send only the items requested
                return Ok(serde_json::to_string_pretty(&debiteuren[skip..(skip + take)]).unwrap());
            }
            Err(_err) => return Err("[]".into()),
        }
    } else if status == 401 {
        // parse new token
        let res = get_bearer_token(
            api_setttings.username.clone(),
            api_setttings.password.clone(),
        )
        .await;

        if res.is_empty() {
            return Err("Access denied".into());
        }

        let req = client
            .get("https://app.esma.be:4430/api/Debiteur")
            .header("Accept", "*/*")
            .header("Authorization", format!("Bearer {}", res));

        let response = req.send().await.unwrap();

        let status = response.status();

        if status == 200 {
            let response2 = response.text().await;
            match response2 {
                Ok(res) => {
                    // convert res into &str
                    let res_slice: &str = &res[..];

                    // parse result
                    let debiteuren: Vec<Debiteur> = serde_json::from_str(res_slice).unwrap();

                    // send only the items requested
                    return Ok(
                        serde_json::to_string_pretty(&debiteuren[skip..(skip + take)]).unwrap(),
                    );
                }
                Err(_err) => return Err("[]".into()),
            }
        } else {
            return Err("[]".into());
        }
    } else {
        return Err("[]".into());
    }
}

#[tauri::command]
fn save_rs232_settings(
    port_name: String,
    baud_rate: u32,
    data_bits_number: u32,
    parity_string: u32,
    stop_bits_number: u32,
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, String> {
    if port_name == "" {
        return Err("Geen port name gespecificeerd".into());
    }

    if baud_rate == 0 {
        return Err("Geen baud rate gespecificeerd".into());
    }

    match data_bits_number {
        5 => {}
        6 => {}
        7 => {}
        8 => {}
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    match parity_string {
        0 => {}
        1 => {}
        2 => {}
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    match stop_bits_number {
        1 => {}
        2 => {}
        _ => return Err("Geen data bits gespecificeerd".into()),
    }

    let rs232_settings = RS232Settings {
        port_name,
        baud_rate,
        data_bits_number,
        parity_string,
        stop_bits_number,
    };

    let exalise_settings = ExaliseSettings {
        mqtt_settings: ExaliseMqttSettings {
            mqtt_key: exalise_settings.mqtt_settings.mqtt_key.clone(),
            mqtt_secret: exalise_settings.mqtt_settings.mqtt_secret.clone(),
            device_key: exalise_settings.mqtt_settings.device_key.clone(),
        },
        http_settings: ExaliseHttpSettings {
            http_key: exalise_settings.http_settings.http_key.clone(),
            http_secret: exalise_settings.http_settings.http_secret.clone(),
        },
        rs232_settings,
    };

    // Save the JSON structure into the other file.
    let res = std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
        serde_json::to_string_pretty(&exalise_settings).unwrap(),
    );

    match res {
        Ok(_v) => return Ok("Saved".into()),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn save_exalise_mqtt_settings(
    mqtt_key: String,
    mqtt_secret: String,
    device_key: String,
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, String> {
    let mqtt_settings = ExaliseMqttSettings {
        mqtt_key,
        mqtt_secret,
        device_key,
    };

    let exalise_settings = ExaliseSettings {
        mqtt_settings,
        http_settings: ExaliseHttpSettings {
            http_key: exalise_settings.http_settings.http_key.clone(),
            http_secret: exalise_settings.http_settings.http_secret.clone(),
        },
        rs232_settings: RS232Settings {
            port_name: exalise_settings.rs232_settings.port_name.clone(),
            baud_rate: exalise_settings.rs232_settings.baud_rate.clone(),
            data_bits_number: exalise_settings.rs232_settings.data_bits_number.clone(),
            parity_string: exalise_settings.rs232_settings.parity_string.clone(),
            stop_bits_number: exalise_settings.rs232_settings.stop_bits_number.clone(),
        },
    };

    // Save the JSON structure into the other file.
    let res = std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
        serde_json::to_string_pretty(&exalise_settings).unwrap(),
    );

    match res {
        Ok(_v) => return Ok("Saved".into()),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn save_api_settings(username: String, password: String) -> Result<String, String> {
    let api_settings: ApiSettings = ApiSettings {
        username: username.clone(),
        password: password.clone(),
    };

    // Save the JSON structure into the other file.
    let res = std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/api.settings.json",
        serde_json::to_string_pretty(&api_settings).unwrap(),
    );

    match res {
        Ok(_v) => return Ok("Saved".into()),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn save_basic_settings(gesture: String, dashboard: String) -> Result<String, String> {
    let basic_settings: BasicSettings = BasicSettings { gesture_control: gesture.clone(), automatic_load_dashboard: dashboard.clone() };

    // Save the JSON structure into the other file.
    let res = std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/basic.settings.json",
        serde_json::to_string_pretty(&basic_settings).unwrap(),
    );

    match res {
        Ok(_v) => return Ok("Saved".into()),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn save_exalise_http_settings(
    http_key: String,
    http_secret: String,
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, String> {
    let http_settings = ExaliseHttpSettings {
        http_key,
        http_secret,
    };

    let exalise_settings = ExaliseSettings {
        mqtt_settings: ExaliseMqttSettings {
            mqtt_key: exalise_settings.mqtt_settings.mqtt_key.clone(),
            mqtt_secret: exalise_settings.mqtt_settings.mqtt_secret.clone(),
            device_key: exalise_settings.mqtt_settings.device_key.clone(),
        },
        http_settings,
        rs232_settings: RS232Settings {
            port_name: exalise_settings.rs232_settings.port_name.clone(),
            baud_rate: exalise_settings.rs232_settings.baud_rate.clone(),
            data_bits_number: exalise_settings.rs232_settings.data_bits_number.clone(),
            parity_string: exalise_settings.rs232_settings.parity_string.clone(),
            stop_bits_number: exalise_settings.rs232_settings.stop_bits_number.clone(),
        },
    };

    // Save the JSON structure into the other file.
    let res = std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
        serde_json::to_string_pretty(&exalise_settings).unwrap(),
    );

    match res {
        Ok(_v) => return Ok("Saved".into()),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command(async)]
async fn save_alerts(alert_items: Vec<Alert>) -> Result<String, String> {
    let alerts = Alerts {
        alerts: alert_items,
    };

    // Save the JSON structure into the other file.
    let res = std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/alerts.exalise.json",
        serde_json::to_string_pretty(&alerts).unwrap(),
    );

    match res {
        Ok(_v) => {
            return Ok("Saved".into());
        }
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn get_alerts() -> Result<String, String> {
    let res = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/alerts.exalise.json",
    );

    match res {
        Ok(v) => return Ok(v),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn get_exalise_settings() -> Result<String, String> {
    let res = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/settings.exalise.json",
    );

    match res {
        Ok(v) => return Ok(v),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn get_api_settings() -> Result<String, String> {
    let res = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/api.settings.json",
    );

    match res {
        Ok(v) => return Ok(v),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command]
fn get_basic_settings() -> Result<String, String> {
    let res = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/basic.settings.json",
    );

    match res {
        Ok(v) => return Ok(v),
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command(async)]
async fn get_dashboard(_exalise_settings: State<'_, ExaliseSettings>) -> Result<String, String> {
    let res = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
    );

    match res {
        Ok(v) => {
            return Ok(v);
        }
        Err(_e) => {
            //println!("{:?}", e);
            return Ok("Error".into());
        }
    }
}

#[tauri::command(async)]
async fn save_device_to_dashboard(device: Device) -> Result<Dashboard, String> {
    let _device_key = device.key.clone();

    let mut dashboard: Dashboard;

    let res = std::fs::read_to_string(
        &"C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
    );

    match res {
        Ok(v) => {
            let ress = serde_json::from_str::<Dashboard>(&v);
            match ress {
                Ok(r) => {
                    dashboard = r;
                }
                Err(_err) => {
                    return Err("Error".into());
                }
            }
        }
        Err(_e) => {
            return Err("Error".into());
        }
    }

    let device_id = device.id.clone();

    let layout: Layout = Layout {
        i: device_id,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
    };

    dashboard.devices.push(device);
    dashboard.layout.push(layout);

    std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
        serde_json::to_string_pretty(&dashboard).unwrap(),
    )
    .unwrap();

    return Ok(dashboard);
}

#[tauri::command(async)]
async fn save_widget_to_dashboard(dashboard: Dashboard) -> Result<Dashboard, String> {
    std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
        serde_json::to_string_pretty(&dashboard).unwrap(),
    )
    .unwrap();

    return Ok(dashboard);
}

#[tauri::command]
fn get_exalise_connection() -> bool {
    if !CONNECTED_TO_EXALISE.load(Ordering::Relaxed) {
        return false;
    } else {
        return true;
    }
}

#[tauri::command(async)]
async fn get_devices(exalise_settings: State<'_, ExaliseSettings>) -> Result<String, String> {
    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.exalise.com/api/getalldevicesanddevicegroups")
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => return Ok(res.into()),
        Err(_err) => return Err("[]".into()),
    }
}

#[tauri::command(async)]
async fn get_device(
    device_id: String,
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, bool> {
    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();

    let client = reqwest::Client::new();
    let response = client
        .get(format!(
            "https://api.exalise.com/api/getdeviceorgroup/{}",
            device_id
        ))
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => return Ok(res.into()),
        Err(_err) => return Err(false),
    }
}

#[tauri::command(async)]
async fn get_own_device(
    exalise_settings: State<'_, ExaliseSettings>,
) -> Result<String, bool> {
    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.exalise.com/api/getdeviceorgroup")
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => return Ok(res.into()),
        Err(_err) => return Err(false),
    }
}


#[tauri::command(async)]
async fn get_last_value(
    device_id: String,
    device_key: String,
    datapoint_key: String,
    exalise_settings: State<'_, ExaliseSettings>,
    last_value_store: State<'_, RwLock<LastValueStore>>,
) -> Result<String, String> {
    let last_value_store_mutex = last_value_store.clone();
    let key_to_find = format!("{}---{}", device_key, datapoint_key);
    let key_to_find_str = key_to_find.as_str();

    match get_value_by_key(last_value_store_mutex, key_to_find_str).await {
        Some(res) => {
            return Ok(res.into());
        }
        None => {
            let device_key = exalise_settings.mqtt_settings.device_key.clone();
            let http_key = exalise_settings.http_settings.http_key.clone();
            let http_secret = exalise_settings.http_settings.http_secret.clone();

            let client = reqwest::Client::new();
            let response = client
                .get(format!(
                    "https://api.exalise.com/api/getvalue/{}/{}",
                    device_id, datapoint_key
                ))
                .header("x-api-key", http_key)
                .header("x-api-secret", http_secret)
                .header("x-master-device-key", device_key)
                .send()
                .await
                .unwrap()
                .text()
                .await;

            match response {
                Ok(res) => {
                    // Find and update the item with the specified key, or insert a new entry
                    let value = res.clone();

                    find_and_update_or_insert_item_by_key(
                        last_value_store,
                        key_to_find_str,
                        value.as_str(),
                    )
                    .await;

                    return Ok(res.into());
                }
                Err(_err) => {
                    return Err("".into());
                }
            }
        }
    };
}

#[tauri::command(async)]
async fn save_dashboard_layout(dashboard: Dashboard) -> Result<String, String> {
    std::fs::write(
        "C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/dashboard.exalise.json",
        serde_json::to_string_pretty(&dashboard).unwrap(),
    )
    .unwrap();

    return Ok("saved".into());
}

#[tauri::command()]
fn get_pdf_file() -> Result<String, String> {
    return Ok("Ok".into());
}

#[tauri::command()]
fn write_to_log_file(data: String) -> bool {
    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("C:/Users/Gebruiker/Documents/cnc-monitoring-sofware-settings/logs.txt");

    match file {
        Ok(mut f) => match f.write_all(data.as_bytes()) {
            Ok(_ok) => return true,
            Err(_err) => return false,
        },
        Err(_e) => return false,
    }
}

#[tauri::command(async)]
async fn get_quiz(exalise_settings: State<'_, ExaliseSettings>) -> Result<String, String> {
    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.exalise.com/api/getquiz")
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => return Ok(res.into()),
        Err(_err) => return Err("[]".into()),
    }
}

#[tauri::command(async)]
async fn get_question(quiz_id: String, question_id: String, exalise_settings: State<'_, ExaliseSettings>) -> Result<String, String> {
    if question_id == "" {
        // fetch first question
        let device_key = exalise_settings.mqtt_settings.device_key.clone();
        let http_key = exalise_settings.http_settings.http_key.clone();
        let http_secret = exalise_settings.http_settings.http_secret.clone();

        let client = reqwest::Client::new();
        let response = client
            .get(format!("https://api.exalise.com/api/getquestion/{}", quiz_id))
            .header("x-api-key", http_key)
            .header("x-api-secret", http_secret)
            .header("x-master-device-key", device_key)
            .send()
            .await
            .unwrap()
            .text()
            .await;

        match response {
            Ok(res) => return Ok(res.into()),
            Err(_err) => return Err("".into()),
        }
    }
    
    
    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();

    let client = reqwest::Client::new();
    let response = client
        .get(format!("https://api.exalise.com/api/getquestion/{}/{}", quiz_id, question_id))
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => return Ok(res.into()),
        Err(_err) => return Err("".into()),
    }
}

#[tauri::command(async)]
async fn get_end_answer(end_answer_id: String, exalise_settings: State<'_, ExaliseSettings>) -> Result<String, String> {
    let device_key = exalise_settings.mqtt_settings.device_key.clone();
    let http_key = exalise_settings.http_settings.http_key.clone();
    let http_secret = exalise_settings.http_settings.http_secret.clone();

    let client = reqwest::Client::new();
    let response = client
        .get(format!("https://api.exalise.com/api/getendanswer/{}", end_answer_id))
        .header("x-api-key", http_key)
        .header("x-api-secret", http_secret)
        .header("x-master-device-key", device_key)
        .send()
        .await
        .unwrap()
        .text()
        .await;

    match response {
        Ok(res) => return Ok(res.into()),
        Err(_err) => return Err("".into()),
    }
}

#[tauri::command(async)]
async fn post_remove_cache(
    last_value_store: State<'_, RwLock<LastValueStore>>,
) -> Result<String, String> {

    // Acquire a write lock to the LastValueStore
    let mut data = last_value_store.write().await;

    // Clear the data in LastValueStore
    data.lastvaluestoreitem.clear();

    Ok("Cache removed successfully".to_string())
}


/* #[tauri::command(async)]
async fn get_last_value_from_internal_store(
    device_id: String,
    datapoint_key: String,
    last_value_store_mutex: State<'_, RwLock<LastValueStore>>,
) -> Result<String, String> {
    let last_value_store_read = last_value_store_mutex.read().await;

    let key_to_find = format!("{}---{}", device_id, datapoint_key);
    let key_to_find_str = key_to_find.as_str();

    match get_value_by_key(&last_value_store_read, key_to_find_str) {
        Some(value) => {
            println!("Some value found");
            return Ok(value.into());
        }
        None => {
            println!("No value found");
            return Ok("".into());
        }
    }
}
 */
