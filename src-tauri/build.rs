use std::{env, path::PathBuf};

fn main() {
    tauri_build::try_build(tauri_attributes()).expect("failed to run tauri-build")
}

/// Tauri links its Windows application manifest (Common Controls v6) into binaries only, so the
/// lib unit-test executable starts without it and Windows refuses to load it
/// (`STATUS_ENTRYPOINT_NOT_FOUND`). On MSVC, embed the same manifest through the linker for every
/// linked target instead, and keep Tauri from adding a second copy to the binaries.
fn tauri_attributes() -> tauri_build::Attributes {
    let attributes = tauri_build::Attributes::new();
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_env = env::var("CARGO_CFG_TARGET_ENV").unwrap_or_default();
    if target_os != "windows" || target_env != "msvc" {
        return attributes;
    }

    let app_manifest = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"))
        .join("windows-app-manifest.xml");
    println!("cargo:rerun-if-changed={}", app_manifest.display());
    println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
    println!(
        "cargo:rustc-link-arg=/MANIFESTINPUT:{}",
        app_manifest.display()
    );
    // Tauri's manifest has no trustInfo section; keep it that way.
    println!("cargo:rustc-link-arg=/MANIFESTUAC:NO");
    attributes.windows_attributes(tauri_build::WindowsAttributes::new_without_app_manifest())
}
