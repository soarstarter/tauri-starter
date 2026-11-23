use serde::Serialize;
use specta::Type;
use tauri::AppHandle;

use super::{logs, redaction::redact_string};

#[derive(Debug, Clone, Serialize, Type)]
pub struct AppDiagnostics {
    pub name: String,
    pub version: String,
    pub commit_sha: String,
    pub build_time: String,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct RuntimeDiagnostics {
    pub tauri: String,
    pub webview: String,
    pub pid: u32,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct OsDiagnostics {
    pub platform: String,
    pub release: String,
    pub arch: String,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct Diagnostics {
    pub app: AppDiagnostics,
    pub versions: RuntimeDiagnostics,
    pub os: OsDiagnostics,
    pub log_path: String,
}

#[tauri::command]
#[specta::specta]
pub fn diagnostics(app: AppHandle) -> Diagnostics {
    let package = app.package_info();
    Diagnostics {
        app: AppDiagnostics {
            name: package.name.to_string(),
            version: package.version.to_string(),
            commit_sha: option_env!("VITE_COMMIT_SHA").unwrap_or("dev").to_string(),
            build_time: option_env!("VITE_BUILD_TIME").unwrap_or("dev").to_string(),
        },
        versions: RuntimeDiagnostics {
            tauri: tauri::VERSION.to_string(),
            webview: "unknown".to_string(),
            pid: std::process::id(),
        },
        os: OsDiagnostics {
            platform: std::env::consts::OS.to_string(),
            release: tauri_plugin_os::version().to_string(),
            arch: std::env::consts::ARCH.to_string(),
        },
        log_path: redact_string(
            &logs::log_file(&app)
                .map(|path| path.to_string_lossy().to_string())
                .unwrap_or_else(|error| format!("unavailable: {error}")),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Diagnostics {
        Diagnostics {
            app: AppDiagnostics {
                name: "Tauri Starter".into(),
                version: "1.2.3".into(),
                commit_sha: "abc123".into(),
                build_time: "2026-07-07".into(),
            },
            versions: RuntimeDiagnostics {
                tauri: "2.0.0".into(),
                webview: "unknown".into(),
                pid: 4242,
            },
            os: OsDiagnostics {
                platform: "macos".into(),
                release: "15.0".into(),
                arch: "aarch64".into(),
            },
            log_path: "/tmp/tauri-starter/app.log".into(),
        }
    }

    #[test]
    fn serializes_to_the_snake_case_shape_the_frontend_bindings_expect() {
        let json = serde_json::to_value(sample()).expect("diagnostics serialize");

        // The "Copy diagnostics" contract: keys must stay snake_case so the
        // committed specta bindings (AppDiagnostics/Diagnostics) keep matching.
        assert_eq!(json["app"]["commit_sha"], "abc123");
        assert_eq!(json["app"]["build_time"], "2026-07-07");
        assert_eq!(json["versions"]["pid"], 4242);
        assert_eq!(json["os"]["arch"], "aarch64");
        assert_eq!(json["log_path"], "/tmp/tauri-starter/app.log");
    }
}
