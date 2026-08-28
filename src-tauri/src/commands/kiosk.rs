use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

const EXALISE_GRAPHQL: &str = "https://api.exalise.com/graphql";
const MESSAGE_HANDLER: &str = "https://message-handler.exalise.com";

// Why the network layer lives in Rust rather than `fetch` in the webview:
// every other outbound call in this app already does, the reqwest client is
// shared and carries the 20s timeout, and it keeps the secret out of anything
// the webview can read back.
//
// The credentials are the ones this installation was already provisioned with
// - the `x-api-key`/`x-api-secret` pair every other call in devices.rs and
// dashboard.rs sends, plus the master device key identifying this screen.
// There is deliberately no separate time-clock credential: pairing a dozen
// floor screens by hand was the entire reason the feature went unused, and
// both backends now accept this pair for the kiosk endpoints (see
// isAuthKioskTerminal.ts in api.exalise.com and isAuthKiosk.ts in the message
// handler). A screen that can already talk to Exalise can clock people in.

/// One employee tile on the terminal. Mirrors `KioskEmployee` in
/// api.exalise.com's KioskResolver - deliberately no more than a name, a
/// clock state and whether a PIN exists yet.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct KioskEmployee {
    pub id: String,
    #[serde(rename = "firstName")]
    pub first_name: String,
    #[serde(rename = "lastName")]
    pub last_name: String,
    #[serde(rename = "isCheckedIn")]
    pub is_checked_in: bool,
    #[serde(rename = "checkedInSince")]
    pub checked_in_since: Option<String>,
    #[serde(rename = "hasPin")]
    pub has_pin: bool,
}

/// Every kiosk call answers with one of these rather than throwing, because the
/// interesting failures here are *expected* ones the screen has to render
/// differently - a wrong PIN keeps the keypad up, a cooldown counts down in
/// place, an unpaired terminal explains itself. Only genuinely unexpected
/// conditions come back as `Err`.
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KioskResponse<T: Serialize> {
    /// "ok" | "unconfigured" | "unauthenticated" | "wrong_pin" | "no_pin"
    /// | "cooldown" | "not_found" | "offline" | "error"
    pub outcome: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_after_ms: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl<T: Serialize> KioskResponse<T> {
    fn ok(data: T) -> Self {
        KioskResponse {
            outcome: "ok".into(),
            data: Some(data),
            retry_after_ms: None,
            message: None,
        }
    }

    fn fail(outcome: &str) -> Self {
        KioskResponse {
            outcome: outcome.into(),
            data: None,
            retry_after_ms: None,
            message: None,
        }
    }

    fn fail_with(outcome: &str, message: String) -> Self {
        KioskResponse {
            outcome: outcome.into(),
            data: None,
            retry_after_ms: None,
            message: Some(message),
        }
    }
}

/// The result of one accepted clock tap.
#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KioskClockResult {
    /// "IN" | "OUT" | "undone"
    pub status: String,
    pub employee_name: String,
    pub time: String,
}

/// The credentials this screen presents, read out of config so the lock is
/// dropped again before any network call - a clock request that hangs must
/// never block a settings save.
///
/// `None` means the installation has not had its Exalise credentials filled in
/// at all, which is the same condition that stops the dashboard working; the
/// time clock says so rather than failing as if the login were wrong.
struct KioskCredentials {
    http_key: String,
    http_secret: String,
    /// Which screen this is. Sent so the server can push clock events made on
    /// the other terminals back to this one over MQTT.
    device_key: String,
}

async fn kiosk_credentials(state: &State<'_, AppState>) -> Option<KioskCredentials> {
    let config = state.config.read().await;
    let http = &config.exalise.http_settings;
    let device_key = config.exalise.mqtt_settings.device_key.clone();

    // The defaults are the literal placeholder strings ExaliseHttpSettings
    // ships with, so a machine nobody has configured yet is caught here
    // instead of spending a round trip to be told it is unauthenticated.
    if http.http_key.is_empty()
        || http.http_secret.is_empty()
        || http.http_key == "http_key"
        || http.http_secret == "http_secret"
    {
        return None;
    }

    Some(KioskCredentials {
        http_key: http.http_key.clone(),
        http_secret: http.http_secret.clone(),
        device_key,
    })
}

/// True when a GraphQL reply carries the API's UNAUTHENTICATED error, which
/// `isAuthKioskTerminal` throws for a bad, deleted or revoked credential
/// alike, and also for a licence without the time management product.
fn is_unauthenticated(json: &serde_json::Value) -> bool {
    json.get("errors")
        .and_then(|e| e.as_array())
        .map(|errors| {
            errors
                .iter()
                .any(|e| e.get("message").and_then(|m| m.as_str()) == Some("UNAUTHENTICATED"))
        })
        .unwrap_or(false)
}

#[tauri::command(async)]
pub async fn kiosk_get_employees(
    state: State<'_, AppState>,
) -> Result<KioskResponse<Vec<KioskEmployee>>, AppError> {
    let credentials = match kiosk_credentials(&state).await {
        Some(c) => c,
        None => return Ok(KioskResponse::fail("unconfigured")),
    };

    let body = serde_json::json!({
        "query": "query { kioskEmployeeGetAll { id firstName lastName isCheckedIn checkedInSince hasPin } }"
    });

    let response = match state
        .http_client
        .post(EXALISE_GRAPHQL)
        .header("x-api-key", &credentials.http_key)
        .header("x-api-secret", &credentials.http_secret)
        .header("x-master-device-key", &credentials.device_key)
        .json(&body)
        .send()
        .await
    {
        Ok(r) => r,
        // No answer at all is a different thing from a refusal, and the screen
        // says so: a factory floor terminal loses its line often enough that
        // "check your connection" must not read as "your login is wrong".
        Err(_) => return Ok(KioskResponse::fail("offline")),
    };

    let json: serde_json::Value = match response.json().await {
        Ok(j) => j,
        Err(_) => return Ok(KioskResponse::fail("error")),
    };

    if is_unauthenticated(&json) {
        return Ok(KioskResponse::fail("unauthenticated"));
    }

    match json.pointer("/data/kioskEmployeeGetAll") {
        Some(list) => {
            let employees: Vec<KioskEmployee> = serde_json::from_value(list.clone())?;
            Ok(KioskResponse::ok(employees))
        }
        None => Ok(KioskResponse::fail("error")),
    }
}

/// Sets an employee's *first* PIN from this terminal. The API refuses to
/// overwrite one that already exists, so a stale `has_pin: false` on screen
/// cannot be used to take over a colleague's account - the mutation comes back
/// with "PIN already set" and the screen falls through to the normal keypad.
#[tauri::command(async)]
pub async fn kiosk_set_initial_pin(
    employee_id: String,
    pin: String,
    state: State<'_, AppState>,
) -> Result<KioskResponse<()>, AppError> {
    let credentials = match kiosk_credentials(&state).await {
        Some(c) => c,
        None => return Ok(KioskResponse::fail("unconfigured")),
    };

    let body = serde_json::json!({
        "query": "mutation ($employeeId: String!, $pin: String!) { kioskEmployeeSetInitialPin(employeeId: $employeeId, pin: $pin) { ok error } }",
        "variables": { "employeeId": employee_id, "pin": pin }
    });

    let response = match state
        .http_client
        .post(EXALISE_GRAPHQL)
        .header("x-api-key", &credentials.http_key)
        .header("x-api-secret", &credentials.http_secret)
        .header("x-master-device-key", &credentials.device_key)
        .json(&body)
        .send()
        .await
    {
        Ok(r) => r,
        Err(_) => return Ok(KioskResponse::fail("offline")),
    };

    let json: serde_json::Value = match response.json().await {
        Ok(j) => j,
        Err(_) => return Ok(KioskResponse::fail("error")),
    };

    if is_unauthenticated(&json) {
        return Ok(KioskResponse::fail("unauthenticated"));
    }

    let result = match json.pointer("/data/kioskEmployeeSetInitialPin") {
        Some(r) => r.clone(),
        None => return Ok(KioskResponse::fail("error")),
    };

    if result.get("ok").and_then(|v| v.as_bool()) == Some(true) {
        return Ok(KioskResponse::ok(()));
    }

    let message = result
        .get("error")
        .and_then(|v| v.as_str())
        .unwrap_or("There has been an error")
        .to_string();

    Ok(KioskResponse::fail_with("error", message))
}

/// Submits one PIN-verified clock tap. Goes to message-handler.exalise.com,
/// not the API: that service owns the WorkSession toggle, the cooldown/undo
/// windows, the live broadcast and the alert bot.
///
/// `client_event_id` is this tap's own identity, reused when the same tap is
/// retried, so a lost response can be re-sent without the server reading it as
/// a deliberate second punch (which inside the 30s cancel window would undo the
/// check-in instead of confirming it).
#[tauri::command(async)]
pub async fn kiosk_clock(
    employee_id: String,
    pin: String,
    client_event_id: String,
    state: State<'_, AppState>,
) -> Result<KioskResponse<KioskClockResult>, AppError> {
    let credentials = match kiosk_credentials(&state).await {
        Some(c) => c,
        None => return Ok(KioskResponse::fail("unconfigured")),
    };

    let body = serde_json::json!({
        "employeeId": employee_id,
        "pin": pin,
        "clientEventId": client_event_id,
    });

    let response = match state
        .http_client
        .post(format!("{}/api/kiosk/clock", MESSAGE_HANDLER))
        .header("x-api-key", &credentials.http_key)
        .header("x-api-secret", &credentials.http_secret)
        .header("x-master-device-key", &credentials.device_key)
        .json(&body)
        .send()
        .await
    {
        Ok(r) => r,
        // Nothing came back, so nothing was recorded - and the caller keeps its
        // client_event_id so the retry is the same tap rather than a new one.
        Err(_) => return Ok(KioskResponse::fail("offline")),
    };

    let status = response.status().as_u16();
    let json: serde_json::Value = response.json().await.unwrap_or_else(|_| serde_json::json!({}));
    let error = json.get("error").and_then(|v| v.as_str()).unwrap_or("");

    match status {
        200 => Ok(KioskResponse::ok(KioskClockResult {
            status: json
                .get("status")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            employee_name: json
                .get("employeeName")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            time: json
                .get("time")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        })),
        401 if error == "Incorrect PIN" => Ok(KioskResponse::fail("wrong_pin")),
        401 => Ok(KioskResponse::fail("unauthenticated")),
        // The employee picked a PIN a moment ago on another terminal, or this
        // screen's list predates one being cleared.
        400 if error.starts_with("No PIN set") => Ok(KioskResponse::fail("no_pin")),
        404 => Ok(KioskResponse::fail("not_found")),
        429 => Ok(KioskResponse {
            outcome: "cooldown".into(),
            data: None,
            retry_after_ms: Some(
                json.get("retryAfterMs")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(10_000),
            ),
            message: None,
        }),
        _ => Ok(KioskResponse::fail("error")),
    }
}

/// Tells the message handler this screen is showing the time clock, so clock
/// events made on the *other* terminals are pushed here over MQTT while it
/// stays open.
///
/// This is the whole of the live-sync setup on the client side. The screens
/// cannot subscribe to each other directly - a device's broker ACL only ever
/// covers its own key - so the server fans a clock event out to one topic per
/// registered screen, and this is how a screen gets onto that list. The
/// registration lapses by itself, so nothing has to be unregistered when the
/// modal closes or the machine is switched off.
///
/// Returns whether the screen is now receiving live updates. `false` is not an
/// error: a machine with no device key configured still clocks people in
/// perfectly well, it just will not hear about taps made elsewhere until the
/// list is refetched.
#[tauri::command(async)]
pub async fn kiosk_register_screen(state: State<'_, AppState>) -> Result<bool, AppError> {
    let credentials = match kiosk_credentials(&state).await {
        Some(c) => c,
        None => return Ok(false),
    };

    if credentials.device_key.is_empty() || credentials.device_key == "device_key" {
        return Ok(false);
    }

    let response = state
        .http_client
        .post(format!("{}/api/kiosk/screen", MESSAGE_HANDLER))
        .header("x-api-key", &credentials.http_key)
        .header("x-api-secret", &credentials.http_secret)
        .header("x-master-device-key", &credentials.device_key)
        .json(&serde_json::json!({}))
        .send()
        .await;

    // Deliberately swallowed. Registration is an optimisation on top of a list
    // the screen refetches anyway; a terminal that cannot reach the message
    // handler must still show its employee tiles and take a PIN.
    Ok(matches!(response, Ok(r) if r.status().is_success()))
}
