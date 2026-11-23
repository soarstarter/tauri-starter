import { useEffect, useState } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTauri } from '@/hooks/use-tauri'

// Custom minimize / maximize / close controls for Windows and Linux, where
// `decorations: false` removes the native buttons. macOS keeps its native
// traffic-light controls (via `titleBarStyle: "Overlay"`) and does not render
// this component. These are the only interactive elements of the titlebar, so
// they omit `data-tauri-drag-region` and clicks never start a window drag.

interface ControlButtonProps {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}

const ControlButton = ({ label, onClick, danger, children }: ControlButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'inline-flex h-full w-11 items-center justify-center text-muted-foreground transition-colors',
      danger ? 'hover:bg-destructive hover:text-white' : 'hover:bg-muted hover:text-foreground'
    )}
  >
    {children}
  </button>
)

export const WindowControls = () => {
  const win = useTauri('window')
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let unlisten: (() => void) | undefined
    win.onMaximizeChange(setMaximized).then((fn) => {
      unlisten = fn
    })
    return () => unlisten?.()
  }, [win])

  return (
    <div className="flex h-full items-center">
      <ControlButton label="Minimize" onClick={() => void win.minimize()}>
        <Minus className="size-4" />
      </ControlButton>
      <ControlButton label={maximized ? 'Restore' : 'Maximize'} onClick={() => void win.toggleMaximize()}>
        {maximized ? <Copy className="size-3.5" /> : <Square className="size-3.5" />}
      </ControlButton>
      <ControlButton label="Close" danger onClick={() => void win.close()}>
        <X className="size-4" />
      </ControlButton>
    </div>
  )
}
