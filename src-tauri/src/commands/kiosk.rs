use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

const EXALISE_GRAPHQL: &str = "https://api.exalise.com/graphql";
const MESSAGE_HANDLER: &str = "https://message-handler.exalise.com";

// Why the network layer lives in Rust rather than `fetch` in the webview:
// every other outbound call in this app already does, the reqwest client is
// shared and carries the 20s timeout, and it keeps the kiosk secret out of
// anything the webview can read back.

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

/// Reads the credential pair out of config and drops the lock again, so a
/// clock request that hangs on the network never blocks a settings save.
async fn kiosk_headers(state: &State<'_, AppState>) -> Option<(String, String)> {
    let config = state.config.read().await;
    if !config.kiosk.is_configured() {
        return None;
    }
    Some((config.kiosk.kiosk_key.clone(), config.kiosk.kiosk_secret.clone()))
}

/// True when a GraphQL reply carries the API's UNAUTHENTICATED error, which
/// `isAuthKiosk` throws for a bad, deleted or revoked token alike.
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
    let (key, secret) = match kiosk_headers(&state).await {
        Some(pair) => pair,
        None => return Ok(KioskResponse::fail("unconfigured")),
    };

    let body = serde_json::json!({
        "query": "query { kioskEmployeeGetAll { id firstName lastName isCheckedIn checkedInSince hasPin } }"
    });

    let response = match state
        .http_client
        .post(EXALISE_GRAPHQL)
        .header("x-kiosk-key", &key)
        .header("x-kiosk-secret", &secret)
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
    let (key, secret) = match kiosk_headers(&state).await {
        Some(pair) => pair,
        None => return Ok(KioskResponse::fail("unconfigured")),
    };

    let body = serde_json::json!({
        "query": "mutation ($employeeId: String!, $pin: String!) { kioskEmployeeSetInitialPin(employeeId: $employeeId, pin: $pin) { ok error } }",
        "variables": { "employeeId": employee_id, "pin": pin }
    });

    let response = match state
        .http_client
        .post(EXALISE_GRAPHQL)
        .header("x-kiosk-key", &key)
        .header("x-kiosk-secret", &secret)
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
    let (key, secret) = match kiosk_headers(&state).await {
        Some(pair) => pair,
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
        .header("x-kiosk-key", &key)
        .header("x-kiosk-secret", &secret)
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
