import { register, unregisterAll, type ShortcutEvent } from '@tauri-apps/plugin-global-shortcut'
import { appIntents, type NavigationRoute } from '@/lib/intents'
import type { AppSettings } from './settings/schema'
import { getSettings, updateSettings } from './settings/store'

/**
 * `in-window` shortcuts fire only while the app window has focus and are
 * handled in the webview (`useShortcut`). `global` shortcuts are registered
 * with the OS through the global-shortcut plugin and fire even when another app
 * is in front, so they take the key combination away from every other app:
 * use them only for actions that must work from anywhere.
 */
export type ShortcutScope = 'in-window' | 'global'

export interface ShortcutDefinition {
  id: string
  defaultAccelerator: string
  scope: ShortcutScope
  route?: NavigationRoute
}

export const SHORTCUTS: readonly ShortcutDefinition[] = [
  { id: 'palette.open', defaultAccelerator: 'CommandOrControl+K', scope: 'in-window' },
  { id: 'open-settings', defaultAccelerator: 'CommandOrControl+,', scope: 'in-window', route: '/settings' },
]

const globalShortcutsByAccelerator = (settings: AppSettings): Map<string, ShortcutDefinition> =>
  new Map(
    SHORTCUTS.filter((shortcut) => shortcut.scope === 'global').map((shortcut) => [
      settings.shortcuts[shortcut.id] ?? shortcut.defaultAccelerator,
      shortcut,
    ])
  )

export const getShortcutAccelerator = (settings: AppSettings, id: string): string | undefined => {
  const shortcut = SHORTCUTS.find((entry) => entry.id === id)
  return shortcut ? (settings.shortcuts[id] ?? shortcut.defaultAccelerator) : undefined
}

export const detectShortcutConflicts = (overrides: Record<string, string>): string[] => {
  const seen = new Map<string, string>()
  const conflicts = new Set<string>()
  for (const shortcut of SHORTCUTS) {
    const accelerator = overrides[shortcut.id] ?? shortcut.defaultAccelerator
    const existing = seen.get(accelerator)
    if (existing) {
      conflicts.add(existing)
      conflicts.add(shortcut.id)
    } else {
      seen.set(accelerator, shortcut.id)
    }
  }
  return [...conflicts]
}

export const updateShortcutOverride = async (id: string, accelerator: string): Promise<AppSettings> => {
  const settings = await getSettings()
  const shortcuts = { ...settings.shortcuts, [id]: accelerator }
  const conflicts = detectShortcutConflicts(shortcuts)
  if (conflicts.length > 0) throw new Error(`Shortcut conflicts: ${conflicts.join(', ')}`)
  return updateSettings({ shortcuts })
}

/** Register the `global`-scope shortcuts with the OS, replacing any earlier registration. */
export const registerGlobalShortcuts = async (): Promise<void> => {
  await unregisterAll()
  const settings = await getSettings()
  const byAccelerator = globalShortcutsByAccelerator(settings)
  const accelerators = [...byAccelerator.keys()]
  if (accelerators.length === 0) return

  await register(accelerators, (event: ShortcutEvent) => {
    if (event.state !== 'Pressed') return
    const shortcut = byAccelerator.get(event.shortcut)
    if (shortcut?.route) appIntents.dispatch({ type: 'navigate', route: shortcut.route })
  })
}
