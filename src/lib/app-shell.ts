import { isTauri } from '@tauri-apps/api/core'
import { initAppIntents } from '@/lib/intents'
import { installAppMenu } from '@/lib/menu/app-menu'
import { applyTraySetting, initCloseToTray, refreshTrayMenu } from '@/lib/tray/app-tray'
import { registerGlobalShortcuts } from '@/lib/shortcuts'
import { getSettingsStore, SETTINGS_CHANGED_EVENT } from '@/lib/settings/store'
import { onTauriEvent } from '@/lib/tauri/events'
import { tauri } from '@/lib/tauri'
import i18n from '@/lib/i18n'

// Boot-time wiring for the native app shell (Phase 3): the intent sources
// (single-instance + deep links) and the application menu. Guarded by
// `isTauri()` so `pnpm dev:web` (plain Vite, no Tauri host) and unit tests don't
// attempt IPC calls. Phase 4 services are initialized after settings load so
// opt-in features like tray/autostart/notifications/shortcuts honor persisted
// preferences from the first native frame.

export async function initNativeShell(): Promise<void> {
  if (!isTauri()) return
  try {
    await initAppIntents()
    const platform = await tauri.app.platform()
    await installAppMenu(platform)
    i18n.on('languageChanged', () => {
      void installAppMenu(platform)
      void refreshTrayMenu()
    })
    const settingsStore = await getSettingsStore()
    const settings = settingsStore.get()
    await applyTraySetting(settings.minimizeToTray)
    await initCloseToTray(platform, () => settingsStore.get().minimizeToTray)
    await registerGlobalShortcuts()
    await onTauriEvent(SETTINGS_CHANGED_EVENT, async (nextSettings) => {
      await applyTraySetting(nextSettings.minimizeToTray)
      await registerGlobalShortcuts()
    })
  } catch (error) {
    console.error('Failed to initialize native app shell:', error)
  }
}
