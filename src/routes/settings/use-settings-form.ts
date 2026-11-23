import { useCallback, useEffect, useState } from 'react'
import { useConveyor } from '@/hooks/use-conveyor'
import type { ChannelArgs, ChannelReturn } from '@/lib/conveyor/schemas'

export type AppSettings = ChannelReturn<'get-settings'>
export type AppSettingsPatch = ChannelArgs<'set-settings'>[0]

export interface UseSettingsForm {
  settings: AppSettings | null
  updateSettings: (patch: AppSettingsPatch) => Promise<AppSettings | null>
  resetSettings: () => Promise<AppSettings | null>
}

export const useSettingsForm = (): UseSettingsForm => {
  const app = useConveyor('app')
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    let cancelled = false
    app
      .getSettings()
      .then((next) => {
        if (!cancelled) setSettings(next)
      })
      .catch((error) => {
        console.error('Failed to load settings:', error)
      })
    return () => {
      cancelled = true
    }
  }, [app])

  const updateSettings = useCallback(
    async (patch: AppSettingsPatch): Promise<AppSettings | null> => {
      try {
        const next = await app.setSettings(patch)
        setSettings(next)
        return next
      } catch (error) {
        console.error('Failed to update settings:', error)
        return null
      }
    },
    [app]
  )

  const resetSettings = useCallback(async (): Promise<AppSettings | null> => {
    try {
      const next = await app.resetSettings()
      setSettings(next)
      return next
    } catch (error) {
      console.error('Failed to reset settings:', error)
      return null
    }
  }, [app])

  return { settings, updateSettings, resetSettings }
}
