pub mod paths;

use serde::{de::DeserializeOwned, Serialize};
use std::path::Path;

/// Reads T from `path`. If the file is missing or invalid, writes the Default and returns it.
pub fn load_or_default<T>(path: &Path) -> T
where
    T: DeserializeOwned + Default + Serialize,
{
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| {
            let default = T::default();
            let _ = save_json(path, &default);
            default
        })
}

/// Serialises `value` as pretty JSON and writes it to `path`, creating parent dirs as needed.
pub fn save_json<T: Serialize>(path: &Path, value: &T) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(value)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    std::fs::write(path, json)
}
