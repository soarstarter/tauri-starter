import { useEffect, useRef, useState } from 'react'
import type { ResolvedShortcut } from '@/lib/conveyor/schemas'
import { matchesAccelerator, parseAccelerator, type ParsedAccelerator } from '@/utils/accelerator'
import { getSettings } from '@/lib/settings/store'
import { getShortcutAccelerator, SHORTCUTS } from '@/lib/shortcuts'

let shortcutsPromise: Promise<ResolvedShortcut[]> | undefined

const loadShortcuts = (): Promise<ResolvedShortcut[]> => {
  if (!shortcutsPromise) {
    shortcutsPromise = getSettings()
      .then((settings) =>
        SHORTCUTS.map((shortcut) => ({
          id: shortcut.id,
          accelerator: getShortcutAccelerator(settings, shortcut.id) ?? shortcut.defaultAccelerator,
          description: shortcut.id === 'palette.open' ? 'Open command palette' : shortcut.id,
        }))
      )
      .catch((error: unknown) => {
        // Allow a later mount to retry if the first IPC failed.
        shortcutsPromise = undefined
        throw error
      })
  }
  return shortcutsPromise as Promise<ResolvedShortcut[]>
}

export const useShortcuts = (): ResolvedShortcut[] | undefined => {
  const [shortcuts, setShortcuts] = useState<ResolvedShortcut[]>()

  useEffect(() => {
    let cancelled = false
    loadShortcuts()
      .then((entries) => {
        if (!cancelled) setShortcuts(entries)
      })
      .catch((error) => {
        console.error('Failed to load shortcuts:', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return shortcuts
}

export const useShortcut = (id: string, handler: (event: KeyboardEvent) => void): void => {
  const shortcuts = useShortcuts()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!shortcuts) return

    const definition = shortcuts.find((entry) => entry.id === id)
    if (!definition) return

    const parsed: ParsedAccelerator = parseAccelerator(definition.accelerator)

    const onKeyDown = (event: KeyboardEvent) => {
      if (matchesAccelerator(event, parsed)) {
        handlerRef.current(event)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [id, shortcuts])
}
