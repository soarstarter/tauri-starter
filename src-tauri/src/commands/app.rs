use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

/// The running application version, from the bundle metadata.
#[tauri::command]
#[specta::specta]
pub fn version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

/// The host platform identifier: `"macos"`, `"windows"`, `"linux"`, etc.
#[tauri::command]
#[specta::specta]
pub fn platform() -> String {
    std::env::consts::OS.to_string()
}

/// Open an external URL in the user's default browser (or mail client).
///
/// Only `https://` and `mailto:` URLs are allowed — every other scheme is
/// rejected so the webview can never be steered into opening arbitrary
/// protocols. This mirrors the allowlist enforced client-side by the Phase 3.6
/// external-URL guard (`src/lib/tauri/external-url.ts`) and by the scoped
/// `opener` capability, giving three layers that must all agree. All external
/// navigation funnels through this one command.
#[tauri::command]
#[specta::specta]
pub fn open_external(app: AppHandle, url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("mailto:")) {
        return Err(format!("refusing to open disallowed URL scheme: {url}"));
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}
