import { getCurrentWebview } from '@tauri-apps/api/webview'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { commands, type Result } from '@/lib/bindings'

// `window` domain of the native API. Unlike most domains this wraps the
// `@tauri-apps/api` window/webview modules directly rather than generated
// commands — window controls are a first-class client API in Tauri, so the
// titlebar calls `getCurrentWindow().minimize()` etc. through this thin layer
// (per the Phase 3.1 plan) instead of round-tripping custom Rust commands.

const appWindow = () => getCurrentWindow()

// Zoom (port of the Electron `zoom.ts`). The persisted zoom factor lands with
// the settings store in Phase 4.1; until then it is kept in-memory here and
// reset to 1 on each launch.
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3.0
const ZOOM_STEP = 0.1

let currentZoom = 1

const clampZoom = (factor: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(factor * 100) / 100))

function unwrap<T>(result: Result<T, string>): T {
  if (result.status === 'error') throw new Error(result.error)
  return result.data
}

export const windowApi = {
  /** Minimize the window to the taskbar/dock. */
  minimize: () => appWindow().minimize(),
  /** Toggle between maximized and its previous restored size. */
  toggleMaximize: () => appWindow().toggleMaximize(),
  /** Close the window (honors any `onCloseRequested` handler, e.g. close-to-tray). */
  close: () => appWindow().close(),
  /** Whether the window is currently maximized. */
  isMaximized: () => appWindow().isMaximized(),

  /**
   * Subscribe to maximize/unmaximize transitions (the titlebar swaps its
   * maximize/restore icon on change). Fires once immediately with the current
   * state, then on every resize. Returns an unlisten function.
   */
  onMaximizeChange: async (handler: (maximized: boolean) => void): Promise<UnlistenFn> => {
    const win = appWindow()
    const notify = async () => handler(await win.isMaximized())
    await notify()
    return win.onResized(() => {
      void notify()
    })
  },

  /** Set the webview zoom factor (clamped), returning the applied value. */
  setZoom: async (factor: number): Promise<number> => {
    currentZoom = clampZoom(factor)
    await getCurrentWebview().setZoom(currentZoom)
    return currentZoom
  },
  /** Increase zoom by one step. */
  zoomIn: () => windowApi.setZoom(currentZoom + ZOOM_STEP),
  /** Decrease zoom by one step. */
  zoomOut: () => windowApi.setZoom(currentZoom - ZOOM_STEP),
  /** Reset zoom to 100%. */
  resetZoom: () => windowApi.setZoom(1),
  /** The current in-memory zoom factor. */
  getZoom: () => currentZoom,
  /** Show the native Windows system menu used by Alt+Space/right-click titlebars. */
  showSystemMenu: async (position?: { x: number; y: number }): Promise<void> => {
    unwrap(await commands.showWindowSystemMenu(position?.x ?? null, position?.y ?? null))
  },
}

export type WindowApi = typeof windowApi
