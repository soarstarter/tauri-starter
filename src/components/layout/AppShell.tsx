import { Suspense, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { RouteFallback } from '@/components/layout/RouteFallback'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { useCommandPaletteStore } from '@/components/command-palette/command-palette-store'
import { useShortcut } from '@/hooks/use-shortcut'
import { AppHeader } from './AppHeader'
import { Sidebar } from './Sidebar'

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false)
  const toggleCommandPalette = useCommandPaletteStore((s) => s.toggle)
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen)
  const navigate = useNavigate()

  // The reserved `CommandOrControl+K` accelerator toggles the palette (pressing
  // it again while open closes it).
  useShortcut('palette.open', (event) => {
    event.preventDefault()
    toggleCommandPalette()
  })

  useShortcut('open-settings', (event) => {
    event.preventDefault()
    navigate('/settings')
  })

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <AppHeader
        onToggleSidebar={() => setCollapsed((value) => !value)}
        onOpenCommandPalette={() => openCommandPalette(true)}
      />

      <div data-testid="app-banner-slot" id="app-banner-slot">
        <OfflineBanner />
      </div>

      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-auto p-4">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CommandPalette />
      <Toaster />
    </div>
  )
}
