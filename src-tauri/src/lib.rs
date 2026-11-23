mod commands;

use tauri_specta::{collect_commands, Builder};

/// The single tauri-specta builder describing every command exposed to the
/// frontend. Shared by the runtime (`run`) and the bindings-export test so the
/// generated `src/lib/bindings.ts` can never drift from the Rust source.
fn specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::app::version,
        commands::app::platform,
        commands::app::open_external,
        commands::secure::secure_get,
        commands::secure::secure_set,
        commands::secure::secure_delete,
        commands::logs::log_file_path,
        commands::logs::log_tail,
        commands::logs::open_log_folder,
        commands::window::show_window_system_menu,
        commands::diagnostics::diagnostics,
    ])
}

/// TypeScript export config for the generated bindings. The header opts the
/// generated file out of our lint/type/format gate (it is committed as-is and
/// consumers still get full types from its exports).
#[cfg(any(debug_assertions, test))]
fn ts_exporter() -> specta_typescript::Typescript {
    specta_typescript::Typescript::default().header("// @ts-nocheck\n/* eslint-disable */\n")
}

/// Event emitted to the frontend when a second launch is folded into the running
/// instance. The payload is the raw argv of that launch; the frontend parses it
/// against the navigation-route whitelist (see `src/lib/intents/`). Mirrors the
/// Electron template's `app-intent` argv path.
#[cfg(desktop)]
const SINGLE_INSTANCE_EVENT: &str = "single-instance";

/// Bring the main window to the foreground: unminimize, show, and focus. Used by
/// the single-instance callback so re-launching the app (or opening a deep link
/// while it runs) surfaces the existing window instead of spawning a new one.
#[cfg(desktop)]
fn focus_main_window(app: &tauri::AppHandle) {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = specta_builder();

    // Regenerate the TypeScript bindings on every `tauri dev` run so local edits
    // to Rust commands stay in sync. Release builds skip this (the committed
    // file is authoritative; CI regenerates and fails on drift — Phase 8.2).
    #[cfg(debug_assertions)]
    builder
        .export(ts_exporter(), "../src/lib/bindings.ts")
        .expect("failed to export typescript bindings");

    let invoke_handler = builder.invoke_handler();

    let mut tauri_builder = tauri::Builder::default();

    // Single-instance MUST be registered first so it can short-circuit a second
    // launch before any window is created. Desktop-only (the plugin is not built
    // for mobile). The callback focuses the running window and forwards the new
    // process's argv to the frontend intent dispatcher.
    #[cfg(desktop)]
    {
        tauri_builder =
            tauri_builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
                use tauri::Emitter;
                focus_main_window(app);
                let _ = app.emit(SINGLE_INSTANCE_EVENT, argv);
            }));
    }

    tauri_builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("tauri-starter".into()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .max_file_size(5_000_000)
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        // Restores each window's size/position/maximized state on launch and
        // saves it on exit (Phase 3.2).
        .plugin(tauri_plugin_window_state::Builder::default().build())
        // Registers the `tauri-starter://` scheme handler (Phase 3.4). The frontend reads
        // cold-start links via `getCurrent()` and runtime links via `onOpenUrl()`.
        .plugin(tauri_plugin_deep_link::init())
        .setup(|_app| {
            // In development the deep-link scheme is not registered by an
            // installer, so register it at runtime to make `tauri-starter://` links
            // testable during `tauri dev` (no-op on macOS, where the scheme is
            // declared in the bundle Info.plist).
            #[cfg(all(desktop, debug_assertions))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let _ = _app.deep_link().register_all();
            }
            Ok(())
        })
        .invoke_handler(invoke_handler)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{specta_builder, ts_exporter};

    /// Generates `src/lib/bindings.ts` from the command definitions. Runs as
    /// part of `cargo test`; CI fails if the committed file drifts.
    #[test]
    fn export_bindings() {
        specta_builder()
            .export(ts_exporter(), "../src/lib/bindings.ts")
            .expect("failed to export typescript bindings");
    }
}
