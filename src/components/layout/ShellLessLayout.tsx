import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { RouteFallback } from '@/components/layout/RouteFallback'
import { useWindowsSystemMenu } from '@/components/window/use-windows-system-menu'
import { WindowControls } from '@/components/window/window-controls'
import { usePlatform } from '@/hooks/use-platform'

export const ShellLessLayout = () => {
  const systemMenu = useWindowsSystemMenu()
  const platform = usePlatform()
  const showCustomControls = platform !== undefined && platform !== 'macos'

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <div
        data-tauri-drag-region
        data-testid="app-titlebar-drag"
        className="app-titlebar-drag flex h-10 shrink-0 items-center justify-end"
        onContextMenu={systemMenu.onContextMenu}
      >
        {showCustomControls && <WindowControls />}
      </div>
      <main data-testid="shell-less-main" className="flex flex-1 items-center justify-center overflow-auto p-6">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Toaster />
    </div>
  )
}
