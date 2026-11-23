import { Menu } from '@tauri-apps/api/menu'
import { TrayIcon, type TrayIconEvent } from '@tauri-apps/api/tray'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { platform } from '@tauri-apps/plugin-os'
import { APP_NAME } from '@/shared/constants'
import { appIntents, type NavigationRoute } from '@/lib/intents'
import { menuLabel } from '@/lib/menu/labels'
import darkTrayIconUrl from '../../../resources/build/tray/icon-dark.png?url'
import lightTrayIconUrl from '../../../resources/build/tray/icon-light.png?url'
import templateTrayIconUrl from '../../../resources/build/tray/icon-template.png?url'

// System tray (Phase 3.5) — the Tauri port of the Electron template's
// `tray.ts`, built from TS with `@tauri-apps/api/tray` so its labels share the
// same string layer as the menu. The tray is **opt-in**: it is created only
// while `settings.minimizeToTray` is on (wired to the settings store in Phase
// 4.1 via `applyTraySetting`), so it defaults off like every other feature.

const TRAY_ID = 'main-tray'
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'

let tray: TrayIcon | undefined
let colorSchemeQuery: MediaQueryList | undefined
let colorSchemeListener: (() => void) | undefined
const iconBytesCache = new Map<string, Promise<Uint8Array>>()

type TrayIconAsset = {
  url: string
  asTemplate: boolean
}

const isMacos = (): boolean => platform() === 'macos'

const prefersDarkColorScheme = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(COLOR_SCHEME_QUERY).matches

const getTrayIconAsset = (): TrayIconAsset => {
  if (isMacos()) {
    return { url: templateTrayIconUrl, asTemplate: true }
  }
  return {
    url: prefersDarkColorScheme() ? darkTrayIconUrl : lightTrayIconUrl,
    asTemplate: false,
  }
}

const decodeDataUrl = (url: string): Uint8Array | undefined => {
  if (!url.startsWith('data:')) return undefined
  const commaIndex = url.indexOf(',')
  if (commaIndex === -1) throw new Error('Invalid inlined tray icon asset')

  const metadata = url.slice(5, commaIndex)
  const data = url.slice(commaIndex + 1)
  const binary = metadata.includes(';base64') ? atob(data) : decodeURIComponent(data)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const loadIconBytes = (url: string): Promise<Uint8Array> => {
  let iconBytes = iconBytesCache.get(url)
  if (!iconBytes) {
    const inlinedBytes = decodeDataUrl(url)
    iconBytes = inlinedBytes
      ? Promise.resolve(inlinedBytes)
      : fetch(url).then(async (response) => {
          if (!response.ok) throw new Error(`Failed to load tray icon asset: ${url}`)
          return new Uint8Array(await response.arrayBuffer())
        })
    iconBytesCache.set(url, iconBytes)
  }
  return iconBytes
}

const loadTrayIcon = async (): Promise<{ bytes: Uint8Array; asTemplate: boolean }> => {
  const asset = getTrayIconAsset()
  return { bytes: await loadIconBytes(asset.url), asTemplate: asset.asTemplate }
}

const refreshTrayIcon = async (): Promise<void> => {
  if (!tray) return
  const icon = await loadTrayIcon()
  if (icon.asTemplate) {
    await tray.setIconWithAsTemplate(icon.bytes, true)
  } else {
    await tray.setIcon(icon.bytes)
  }
}

const installColorSchemeListener = (): void => {
  if (isMacos() || colorSchemeListener || typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return
  colorSchemeQuery = window.matchMedia(COLOR_SCHEME_QUERY)
  colorSchemeListener = () => {
    void refreshTrayIcon()
  }
  colorSchemeQuery.addEventListener('change', colorSchemeListener)
}

const removeColorSchemeListener = (): void => {
  if (!colorSchemeQuery || !colorSchemeListener) return
  colorSchemeQuery.removeEventListener('change', colorSchemeListener)
  colorSchemeQuery = undefined
  colorSchemeListener = undefined
}

/** Bring the main window forward from the tray. */
const focusMainWindow = async (): Promise<void> => {
  const win = getCurrentWindow()
  if (await win.isMinimized()) await win.unminimize()
  await win.show()
  await win.setFocus()
}

const openRoute = (route: NavigationRoute) => async (): Promise<void> => {
  await focusMainWindow()
  appIntents.dispatch({ type: 'navigate', route })
}

const buildTrayMenu = (): Promise<Menu> =>
  Menu.new({
    items: [
      { text: menuLabel('tray.openMainWindow'), action: () => void focusMainWindow() },
      { text: menuLabel('tray.settings'), action: () => void openRoute('/settings')() },
      { text: menuLabel('tray.about'), action: () => void openRoute('/about')() },
      { item: 'Separator' },
      { item: 'Quit', text: menuLabel('tray.quit') },
    ],
  })

const handleTrayEvent = (event: TrayIconEvent): void => {
  // Left-click focuses the window (matching the Electron tray); right-click is
  // reserved for the context menu by the OS.
  if (event.type === 'Click' && event.button === 'Left' && event.buttonState === 'Up') {
    void focusMainWindow()
  }
}

/** Whether the tray is currently shown. */
export const isTrayActive = (): boolean => tray !== undefined

/** Create the tray icon if it does not already exist. */
export const createTray = async (): Promise<void> => {
  if (tray) return
  const icon = await loadTrayIcon()
  tray = await TrayIcon.new({
    id: TRAY_ID,
    icon: icon.bytes,
    iconAsTemplate: icon.asTemplate,
    tooltip: APP_NAME,
    showMenuOnLeftClick: false,
    menu: await buildTrayMenu(),
    action: handleTrayEvent,
  })
  installColorSchemeListener()
}

/** Remove the tray icon if present. */
export const destroyTray = async (): Promise<void> => {
  if (!tray) return
  removeColorSchemeListener()
  await tray.close()
  tray = undefined
}

/** Rebuild the tray context menu (e.g. after a locale change). */
export const refreshTrayMenu = async (): Promise<void> => {
  if (!tray) return
  await tray.setMenu(await buildTrayMenu())
}

/** Create or destroy the tray to match the `minimizeToTray` setting (Phase 4.1). */
export const applyTraySetting = async (enabled: boolean): Promise<void> => {
  if (enabled) await createTray()
  else await destroyTray()
}

/**
 * Close-to-tray behavior for Windows/Linux (Phase 3.5): when the setting is on
 * and the tray exists, intercept the window close and hide instead. macOS keeps
 * its platform convention (the window closes; the app stays in the dock).
 *
 * `shouldMinimizeToTray` is read live on each close so toggling the setting
 * takes effect immediately. Returns an unlisten function.
 */
export const initCloseToTray = async (platform: string, shouldMinimizeToTray: () => boolean): Promise<UnlistenFn> => {
  if (platform === 'macos') return () => {}
  const win = getCurrentWindow()
  return win.onCloseRequested((event) => {
    if (shouldMinimizeToTray() && isTrayActive()) {
      event.preventDefault()
      void win.hide()
    }
  })
}
