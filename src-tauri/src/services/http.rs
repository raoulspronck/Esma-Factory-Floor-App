use crate::error::AppError;

/// Reads an Exalise API response, turning any non-2xx status into
/// `AppError::Api(status, body)` instead of handing the error body back to
/// the caller as if it were data. The old behavior let bodies like
/// `UNAUTHENTICATED` (404) reach the frontend as an Ok payload, where
/// JSON.parse blew up with no indication of what actually went wrong.
pub async fn read_api_response(response: reqwest::Response) -> Result<String, AppError> {
    let status = response.status();
    let text = response.text().await?;

    if !status.is_success() {
        let snippet: String = text.chars().take(200).collect();
        return Err(AppError::Api(status.as_u16(), snippet));
    }

    Ok(text)
}
