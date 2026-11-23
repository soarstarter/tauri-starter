import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useShortcuts } from '@/hooks/use-shortcut'
import { usePlatform } from '@/hooks/use-platform'
import { useWindowsSystemMenu } from '@/components/window/use-windows-system-menu'
import { WindowControls } from '@/components/window/window-controls'
import { formatAcceleratorForDisplay } from '@/utils/accelerator'

interface AppHeaderProps {
  onToggleSidebar: () => void
  onOpenCommandPalette: () => void
}

export const AppHeader = ({ onToggleSidebar, onOpenCommandPalette }: AppHeaderProps) => {
  const { t } = useTranslation('common')
  const shortcuts = useShortcuts()
  const platform = usePlatform()
  const systemMenu = useWindowsSystemMenu()

  const paletteAccelerator = useMemo(() => {
    const accel = shortcuts?.find((s) => s.id === 'palette.open')?.accelerator
    return accel ? formatAcceleratorForDisplay(accel) : undefined
  }, [shortcuts])

  // Inset the left side of the header on macOS so it does not overlap the
  // system traffic-light controls. Windows/Linux use the custom controls
  // because `decorations: false` removes the native titlebar buttons.
  const isMac = platform === 'macos'
  const showCustomControls = platform !== undefined && !isMac

  return (
    <header
      data-tauri-drag-region
      onContextMenu={systemMenu.onContextMenu}
      className={cn(
        'app-titlebar-drag relative flex h-10 shrink-0 items-center gap-2 border-b border-border bg-card/40',
        showCustomControls ? 'pr-0' : 'pr-2'
      )}
    >
      <div data-tauri-drag-region className={cn('flex items-center', isMac ? 'pl-[78px]' : 'pl-2')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={t('header.toggleSidebar')}
          className="no-drag"
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      <div data-tauri-drag-region className="h-full flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCommandPalette}
        aria-label={t('header.commandPalette')}
        className="no-drag h-7 gap-2 text-xs text-muted-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">{t('header.commandPalette')}</span>
        {paletteAccelerator && (
          <kbd className="ml-2 hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] sm:inline">
            {paletteAccelerator}
          </kbd>
        )}
      </Button>

      {showCustomControls && <WindowControls />}
    </header>
  )
}
