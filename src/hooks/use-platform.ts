import { useEffect, useState } from 'react'
import { useTauri } from '@/hooks/use-tauri'

/** Host platform, as reported by the `app::platform` command. */
export type Platform = 'macos' | 'windows' | 'linux' | 'other'

const normalize = (raw: string): Platform => {
  if (raw === 'macos' || raw === 'windows' || raw === 'linux') return raw
  return 'other'
}

/**
 * Resolve the host platform once on mount. Returns `undefined` until the
 * `app::platform` command answers, so callers can avoid rendering
 * platform-specific chrome (macOS traffic-light inset vs. custom window
 * controls) before the platform is known.
 */
export function usePlatform(): Platform | undefined {
  const app = useTauri('app')
  const [platform, setPlatform] = useState<Platform>()

  useEffect(() => {
    let active = true
    app
      .platform()
      .then((raw) => {
        if (active) setPlatform(normalize(raw))
      })
      .catch(() => {
        if (active) setPlatform('other')
      })
    return () => {
      active = false
    }
  }, [app])

  return platform
}
