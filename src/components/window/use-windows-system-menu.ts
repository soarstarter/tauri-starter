import { useCallback, useEffect } from 'react'
import { usePlatform } from '@/hooks/use-platform'
import { useTauri } from '@/hooks/use-tauri'

const isInteractiveElement = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  Boolean(target.closest('button, a, input, textarea, select, [role="button"], [data-no-system-menu]'))

export function useWindowsSystemMenu() {
  const platform = usePlatform()
  const win = useTauri('window')
  const isWindows = platform === 'windows'

  const showAt = useCallback(
    (position?: { x: number; y: number }) => {
      if (!isWindows) return
      void win.showSystemMenu(position)
    },
    [isWindows, win]
  )

  const onContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!isWindows || isInteractiveElement(event.target)) return
      event.preventDefault()
      showAt({ x: Math.round(event.screenX), y: Math.round(event.screenY) })
    },
    [isWindows, showAt]
  )

  useEffect(() => {
    if (!isWindows) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.code !== 'Space' || isInteractiveElement(event.target)) return
      event.preventDefault()
      showAt()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isWindows, showAt])

  return { onContextMenu }
}
