use std::{
    fs,
    io::{self, BufRead},
    path::PathBuf,
};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

fn log_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_log_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(path)
}

pub fn log_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(log_dir(app)?.join("tauri-starter.log"))
}

#[tauri::command]
#[specta::specta]
pub fn log_file_path(app: AppHandle) -> Result<String, String> {
    Ok(log_file(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
#[specta::specta]
pub fn log_tail(app: AppHandle, lines: u32) -> Result<String, String> {
    let path = log_file(&app)?;
    if !path.exists() {
        return Ok(String::new());
    }

    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let reader = io::BufReader::new(file);
    let mut all_lines = reader
        .lines()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    let keep = usize::try_from(lines.max(1)).unwrap_or(200);
    if all_lines.len() > keep {
        all_lines.drain(0..all_lines.len() - keep);
    }
    Ok(all_lines.join("\n"))
}

#[tauri::command]
#[specta::specta]
pub fn open_log_folder(app: AppHandle) -> Result<(), String> {
    let path = log_dir(&app)?.to_string_lossy().to_string();
    app.opener()
        .open_path(path, None::<String>)
        .map_err(|e| e.to_string())
}
