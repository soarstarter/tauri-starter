/// Show the native Windows system/control menu for an undecorated window.
/// Tauri's `decorations: false` gives us a fully custom HTML titlebar, so
/// Windows no longer receives the non-client-area messages that normally open
/// the Restore/Move/Size/Minimize/Maximize/Close menu. Electron's hidden
/// titlebar still supplies that behavior; this command restores it explicitly.
#[tauri::command]
#[specta::specta]
pub fn show_window_system_menu(
    window: tauri::WebviewWindow,
    x: Option<i32>,
    y: Option<i32>,
) -> Result<(), String> {
    #[cfg(windows)]
    {
        windows_system_menu::show(window, x, y)
    }

    #[cfg(not(windows))]
    {
        let _ = (window, x, y);
        Ok(())
    }
}

#[cfg(windows)]
mod windows_system_menu {
    use std::{ffi::c_void, ptr};

    type Hwnd = *mut c_void;
    type Hmenu = *mut c_void;

    #[repr(C)]
    struct Rect {
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
    }

    #[link(name = "user32")]
    extern "system" {
        fn GetSystemMenu(hwnd: Hwnd, revert: i32) -> Hmenu;
        fn GetWindowRect(hwnd: Hwnd, rect: *mut Rect) -> i32;
        fn SetForegroundWindow(hwnd: Hwnd) -> i32;
        fn TrackPopupMenu(
            menu: Hmenu,
            flags: u32,
            x: i32,
            y: i32,
            reserved: i32,
            hwnd: Hwnd,
            rect: *const c_void,
        ) -> i32;
        fn SendMessageW(hwnd: Hwnd, message: u32, wparam: usize, lparam: isize) -> isize;
    }

    const TPM_RIGHTBUTTON: u32 = 0x0002;
    const TPM_RETURNCMD: u32 = 0x0100;
    const WM_SYSCOMMAND: u32 = 0x0112;

    pub fn show(
        window: tauri::WebviewWindow,
        x: Option<i32>,
        y: Option<i32>,
    ) -> Result<(), String> {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?.0 as Hwnd;

        let (menu_x, menu_y) = match (x, y) {
            (Some(x), Some(y)) => (x, y),
            _ => window_system_menu_position(hwnd)?,
        };

        unsafe {
            let menu = GetSystemMenu(hwnd, 0);
            if menu.is_null() {
                return Err("failed to get the Windows system menu".into());
            }

            // Required before TrackPopupMenu for the menu to dismiss reliably.
            SetForegroundWindow(hwnd);

            let command = TrackPopupMenu(
                menu,
                TPM_RIGHTBUTTON | TPM_RETURNCMD,
                menu_x,
                menu_y,
                0,
                hwnd,
                ptr::null(),
            );

            if command != 0 {
                SendMessageW(hwnd, WM_SYSCOMMAND, command as usize, 0);
            }
        }

        Ok(())
    }

    fn window_system_menu_position(hwnd: Hwnd) -> Result<(i32, i32), String> {
        let mut rect = Rect {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };

        let ok = unsafe { GetWindowRect(hwnd, &mut rect) };
        if ok == 0 {
            return Err("failed to read the Windows window bounds".into());
        }

        Ok((rect.left + 8, rect.top + 8))
    }
}
