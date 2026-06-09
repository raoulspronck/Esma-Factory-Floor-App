use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Alerts {
    pub alerts: Vec<Alert>,
}

impl Default for Alerts {
    fn default() -> Self {
        Alerts { alerts: vec![] }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Alert {
    pub device_key: String,
    pub data_point: String,
    pub require_accept: Option<String>,
}
