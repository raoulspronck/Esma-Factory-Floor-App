use serde::{Deserialize, Serialize};

/// Format v3: each device owns a 2-column x 8-row strip on the dashboard
/// (array order = strip order, max 5 devices). Widget x/y/w/h are LOCAL to
/// the device's strip. `version` is deliberately NOT defaulted: files
/// without it are older formats and must go through migration in
/// `commands::dashboard::load_dashboard`.
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Dashboard {
    pub version: u32,
    pub devices: Vec<Device>,
}

impl Default for Dashboard {
    fn default() -> Self {
        Dashboard {
            version: 3,
            devices: vec![],
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub key: String,
    pub widgets: Vec<Widget>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Widget {
    pub id: String,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
    pub datapoints: Vec<String>,
}

/// The interim flat-grid shape (same fields as v3 but no `version`, and
/// widget coordinates are GLOBAL on a 10-column grid rather than local to a
/// device strip). Kept only for migration.
pub mod v2 {
    use serde::Deserialize;

    #[derive(Deserialize, Debug, Clone)]
    pub struct Dashboard {
        pub devices: Vec<Device>,
    }

    #[derive(Deserialize, Debug, Clone)]
    pub struct Device {
        pub id: String,
        pub name: String,
        pub key: String,
        pub widgets: Vec<Widget>,
    }

    #[derive(Deserialize, Debug, Clone)]
    pub struct Widget {
        pub id: String,
        pub name: String,
        pub x: i32,
        pub y: i32,
        pub w: i32,
        pub h: i32,
        pub datapoints: Vec<String>,
    }
}

/// Pre-redesign shape (device-level `Layout` grid + `display` toggle +
/// row-count `Widget.height`), kept only so `migrate::load_dashboard` can
/// read a user's existing `dashboard.exalise.json` without data loss.
/// Deliberately omits the old `layout`/`display` fields entirely rather than
/// declaring-but-ignoring them - migration never reads old geometry (it
/// recomputes it for the new grid) or the hide/show flag (that feature was
/// removed), and serde ignores unknown JSON fields by default, so this still
/// parses an old file fine without carrying dead fields.
pub mod legacy {
    use serde::Deserialize;

    #[derive(Deserialize, Debug, Clone)]
    pub struct Dashboard {
        pub devices: Vec<Device>,
    }

    #[derive(Deserialize, Debug, Clone)]
    pub struct Device {
        pub id: String,
        pub name: String,
        pub key: String,
        pub widgets: Vec<Widget>,
    }

    #[derive(Deserialize, Debug, Clone)]
    pub struct Widget {
        pub id: String,
        pub name: String,
        pub height: u32,
        pub datapoints: Vec<String>,
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ValueResponse {
    pub id_key: String,
    pub value: String,
}
