// Commands are organized by domain, mirroring the Electron template's Conveyor
// API modules. The frontend calls them through the generated `src/lib/bindings.ts`
// (see the tauri-specta builder in `lib.rs`). Additional domains — window,
// settings, logs, secure, file, notification, shortcut — land with their
// respective phases.

pub mod app;
pub mod diagnostics;
pub mod logs;
pub mod redaction;
pub mod secure;
pub mod window;
