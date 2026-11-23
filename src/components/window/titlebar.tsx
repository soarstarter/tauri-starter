import { cn } from '@/lib/utils'
import { APP_NAME } from '@/shared/constants'
import { usePlatform } from '@/hooks/use-platform'
import { WindowControls } from './window-controls'
import { useWindowsSystemMenu } from './use-windows-system-menu'

// The custom titlebar (Phase 3.1). The `data-tauri-drag-region` attribute makes
// the bar itself draggable and double-click-to-maximize (the
// `internal-toggle-maximize` capability); the interactive window controls omit
// the attribute so they stay clickable.
//
// Platform layout differs:
//   - macOS: native traffic lights overlay the top-left (`titleBarStyle:
//     "Overlay"`), so the content is inset from the left and no custom controls
//     are drawn.
//   - Windows/Linux: `decorations: false`, so custom min/max/close render on the
//     right.
//
// The in-window menu bar (Alt/⌥ toggle, i18next labels) is intentionally not
// built here yet: it depends on the i18n layer (Phase 5.2) and the shared menu
// definition (Phase 3.5 native menus). The app-name label holds its place.

export const Titlebar = () => {
  const platform = usePlatform()
  const systemMenu = useWindowsSystemMenu()
  const isMac = platform === 'macos'
  const showCustomControls = platform !== undefined && !isMac

  return (
    <header
      data-tauri-drag-region
      onContextMenu={systemMenu.onContextMenu}
      className={cn(
        'bg-card/40 border-border relative flex h-10 shrink-0 items-center gap-2 border-b select-none',
        // Inset past the macOS traffic lights; symmetric padding elsewhere.
        isMac ? 'pr-2 pl-[78px]' : 'pr-0 pl-3'
      )}
    >
      <span data-tauri-drag-region className="text-muted-foreground text-xs font-medium">
        {APP_NAME}
      </span>

      <div data-tauri-drag-region className="flex-1" />

      {showCustomControls && <WindowControls />}
    </header>
  )
}
