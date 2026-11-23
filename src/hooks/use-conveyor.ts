import { useMemo } from 'react'
import { tauri } from '@/lib/tauri'
import { exportSettingsBackup, importSettingsBackup } from '@/lib/settings/backup'
import { getSettings, resetSettings, updateSettings } from '@/lib/settings/store'
import { SHORTCUTS, getShortcutAccelerator, type ShortcutDefinition } from '@/lib/shortcuts'
import type { AppSettings } from '@/lib/settings/schema'
import type { ResolvedShortcut } from '@/lib/conveyor/schemas'
import { DEFAULT_LANGUAGE, resolveSupportedLanguage, type SupportedLanguage } from '@/lib/i18n'

const shortcutDescription = (shortcut: ShortcutDefinition): string => {
  if (shortcut.id === 'palette.open') return 'Open command palette'
  if (shortcut.id === 'open-settings') return 'Open settings'
  return shortcut.id
}

const listShortcuts = async (): Promise<ResolvedShortcut[]> => {
  const settings = await getSettings()
  return SHORTCUTS.map((shortcut) => ({
    id: shortcut.id,
    accelerator: getShortcutAccelerator(settings, shortcut.id) ?? shortcut.defaultAccelerator,
    description: shortcutDescription(shortcut),
  }))
}

const conveyor = {
  app: {
    version: tauri.app.version,
    getSettings,
    setSettings: updateSettings,
    resetSettings,
    getDiagnostics: tauri.diagnostics.get,
    getLocale: async () => resolveSupportedLanguage(navigator.language) ?? DEFAULT_LANGUAGE,
    setLocale: async (_language: SupportedLanguage) => {},
    exportData: exportSettingsBackup,
    importData: importSettingsBackup,
  },
  window: {
    webOpenUrl: tauri.app.openExternal,
    windowSetTitlebarDark: async (_dark: boolean) => {},
  },
  logs: {
    getPath: tauri.logs.path,
    readTail: tauri.logs.tail,
    openFolder: async () => {
      await tauri.logs.openFolder()
      return false
    },
  },
  shortcut: {
    list: listShortcuts,
  },
  file: {
    openFilePath: async (path: string) => {
      const settings: AppSettings = await getSettings()
      await updateSettings({
        recentFiles: [path, ...settings.recentFiles.filter((entry) => entry !== path)].slice(0, 10),
      })
      return { canceled: false, path }
    },
  },
} as const

export const useConveyor = <T extends keyof typeof conveyor>(domain: T): (typeof conveyor)[T] => {
  return useMemo(() => conveyor[domain], [domain])
}
