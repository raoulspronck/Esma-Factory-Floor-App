use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExaliseSettings {
    pub mqtt_settings: ExaliseMqttSettings,
    pub http_settings: ExaliseHttpSettings,
    pub rs232_settings: RS232Settings,
}

impl Default for ExaliseSettings {
    fn default() -> Self {
        ExaliseSettings {
            mqtt_settings: ExaliseMqttSettings::default(),
            http_settings: ExaliseHttpSettings::default(),
            rs232_settings: RS232Settings::default(),
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExaliseMqttSettings {
    pub mqtt_key: String,
    pub mqtt_secret: String,
    pub device_key: String,
}

impl Default for ExaliseMqttSettings {
    fn default() -> Self {
        ExaliseMqttSettings {
            mqtt_key: "mqtt_key".into(),
            mqtt_secret: "mqtt_secret".into(),
            device_key: "device_key".into(),
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExaliseHttpSettings {
    pub http_key: String,
    pub http_secret: String,
}

impl Default for ExaliseHttpSettings {
    fn default() -> Self {
        ExaliseHttpSettings {
            http_key: "http_key".into(),
            http_secret: "http_secret".into(),
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct RS232Settings {
    pub port_name: String,
    pub baud_rate: u32,
    pub data_bits_number: u32,
    pub parity_string: u32,
    pub stop_bits_number: u32,
}

impl Default for RS232Settings {
    fn default() -> Self {
        RS232Settings {
            port_name: "".into(),
            baud_rate: 9600,
            data_bits_number: 8,
            parity_string: 0,
            stop_bits_number: 1,
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ApiSettings {
    pub username: String,
    pub password: String,
}

impl Default for ApiSettings {
    fn default() -> Self {
        ApiSettings {
            username: "".into(),
            password: "".into(),
        }
    }
}

/// The kiosk credential pair this terminal clocks people in with, issued from
/// the Exalise dashboard ("Kiosk devices") exactly like a wall tablet's. Kept
/// in its own file rather than folded into ExaliseSettings because it is a
/// different tenant-scoped credential with a different lifetime - revoking a
/// terminal's clock-in rights must not disturb its MQTT/HTTP monitoring keys.
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct KioskSettings {
    pub kiosk_key: String,
    pub kiosk_secret: String,
}

impl Default for KioskSettings {
    fn default() -> Self {
        KioskSettings {
            kiosk_key: "".into(),
            kiosk_secret: "".into(),
        }
    }
}

impl KioskSettings {
    /// Whether this installation has been paired at all. The time-clock button
    /// is still shown when it hasn't - the modal explains what to do rather
    /// than the button silently going missing on a factory floor screen.
    pub fn is_configured(&self) -> bool {
        !self.kiosk_key.is_empty() && !self.kiosk_secret.is_empty()
    }
}

fn default_dashboard_rows() -> u32 {
    7
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct BasicSettings {
    pub gesture_control: String,
    pub automatic_load_dashboard: String,
    /// Rows per device strip on the dashboard grid — per-machine, so each
    /// screen size can pick how dense the grid should be. Defaulted so
    /// pre-existing basic.settings.json files still parse.
    #[serde(default = "default_dashboard_rows")]
    pub dashboard_rows: u32,
}

impl Default for BasicSettings {
    fn default() -> Self {
        BasicSettings {
            gesture_control: "False".into(),
            automatic_load_dashboard: "True".into(),
            dashboard_rows: default_dashboard_rows(),
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct LoginData {
    pub grant_type: String,
    pub username: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Debiteur {
    #[serde(alias = "DebId")]
    pub deb_id: u32,
    #[serde(alias = "DebNaam")]
    pub deb_naam: String,
}
