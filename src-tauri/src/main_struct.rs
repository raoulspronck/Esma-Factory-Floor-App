use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug)]
pub struct Debiteur {
    #[serde(alias = "DebId")]
    pub deb_id: u32,
    #[serde(alias = "DebNaam")]
    pub deb_naam: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginData {
    pub grant_type: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ExaliseSettings {
    pub mqtt_settings: ExaliseMqttSettings,
    pub http_settings: ExaliseHttpSettings,
    pub rs232_settings: RS232Settings,
}



#[derive(Deserialize, Serialize, Debug)]
pub struct RS232Settings {
    pub port_name: String,
    pub  baud_rate: u32,
    pub data_bits_number: u32,
    pub parity_string: u32,
    pub stop_bits_number: u32,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ExaliseHttpSettings {
    pub http_key: String,
    pub http_secret: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ExaliseMqttSettings {
    pub mqtt_key: String,
    pub mqtt_secret: String,
    pub device_key: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Dashboard {
    pub layout: Vec<Layout>,
    pub devices: Vec<Device>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Layout {
    pub  i: String,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub key: String,
    pub  display: bool,
    pub widgets: Vec<Widget>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Widget {
    pub id: String,
    pub name: String,
    pub height: u32,
    pub datapoints: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Alerts {
    pub alerts: Vec<Alert>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Alert {
    pub device_key: String,
    pub data_point: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiSettings {
    pub username: String,
    pub password: String
}

