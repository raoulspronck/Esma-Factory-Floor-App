use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Dashboard {
    pub layout: Vec<Layout>,
    pub devices: Vec<Device>,
}

impl Default for Dashboard {
    fn default() -> Self {
        Dashboard {
            layout: vec![],
            devices: vec![],
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Layout {
    pub i: String,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub key: String,
    pub display: bool,
    pub widgets: Vec<Widget>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Widget {
    pub id: String,
    pub name: String,
    pub height: u32,
    pub datapoints: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ValueResponse {
    pub id_key: String,
    pub value: String,
}
