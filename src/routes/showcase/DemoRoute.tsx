import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { isTauri } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import {
  Bell,
  ClipboardList,
  Download,
  FileText,
  Languages,
  Maximize2,
  Menu,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { eulaConfig } from '@/components/onboarding/onboarding-state'
import { useCommandPaletteStore } from '@/components/command-palette/command-palette-store'
import { useConveyor } from '@/hooks/use-conveyor'
import { sendNotification } from '@/lib/notifications'
import { appIntents } from '@/lib/intents'
import { parseDeepLinkUrl } from '@/lib/intents/parse'
import { installAppMenu } from '@/lib/menu/app-menu'
import { exportSettingsBackup, importSettingsBackup } from '@/lib/settings/backup'
import { getSettings, updateSettings } from '@/lib/settings/store'
import { type AccentPreference, applyAccentPreference, applyThemePreference } from '@/utils/theme-settings'
import { applyTraySetting, isTrayActive, refreshTrayMenu } from '@/lib/tray/app-tray'
import { tauri } from '@/lib/tauri'
import type { SecureKey } from '@/lib/settings/schema'
import { changeLanguage, resolveSupportedLanguage, type SupportedLanguage } from '@/lib/i18n'
import { PROTOCOL_SCHEME } from '@/shared/constants'
import { capabilityForRoute } from '@/showcase/capability-catalog'
import { formatAcceleratorForDisplay } from '@/utils/accelerator'
import type { TemplateCapability } from '@/showcase/capability-types'
import { ShowcasePage } from './ShowcasePage'
import { useSettingsForm } from '../settings/use-settings-form'

type RunState = { kind: 'idle' } | { kind: 'ok'; message: string } | { kind: 'error'; message: string }

const DEMO_SECRET_KEY: SecureKey = 'showcase-secret'
const DEMO_SECRET_DEFAULT = 'stored by the showcase'

const stringifyError = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2)

const StatusLine = ({ state }: { state: RunState }) => {
  if (state.kind === 'idle') return null
  return (
    <p
      className={
        state.kind === 'ok'
          ? 'rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300'
          : 'rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'
      }
    >
      {state.message}
    </p>
  )
}

const FieldRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex min-h-8 items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="max-w-[60%] truncate text-right font-medium">{value}</span>
  </div>
)

const DemoPanel = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <section className="rounded-lg border border-border bg-card p-4">
    <div className="space-y-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <div className="mt-4 space-y-3">{children}</div>
  </section>
)

const DemoLayout = ({ capability, children }: { capability: TemplateCapability; children: ReactNode }) => {
  const { t } = useTranslation('showcase')
  const Icon = capability.icon

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="px-0">
          <Link to="/showcase">{t('actions.back')}</Link>
        </Button>
        <div className="flex flex-wrap items-start gap-3">
          <div className="rounded-lg border border-border bg-card p-2">
            <Icon className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{t(capability.labelKey)}</h1>
              <Badge variant="outline">{t(`status.${capability.status}`)}</Badge>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">{t(capability.summaryKey)}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">{children}</div>
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="font-medium">{t('sourceFiles')}</h2>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {(capability.sourceFiles ?? []).map((file) => (
                <li key={file} className="break-all font-mono">
                  {file}
                </li>
              ))}
            </ul>
          </section>
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            {t(`callouts.${capability.status}`)}
          </p>
        </aside>
      </div>
    </section>
  )
}

const WindowDemo = () => {
  const [zoom, setZoom] = useState(tauri.window.getZoom())
  const [maximized, setMaximized] = useState<boolean | null>(null)
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  useEffect(() => {
    let cancelled = false
    tauri.window
      .onMaximizeChange((next) => {
        if (!cancelled) setMaximized(next)
      })
      .catch((error) => {
        if (!cancelled) setState({ kind: 'error', message: stringifyError(error) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const runWindowAction = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      setZoom(tauri.window.getZoom())
      setState({ kind: 'ok', message })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel title="Window controls" description="Exercise the same APIs used by the custom titlebar and view menu.">
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldRow label="Host" value={isTauri() ? 'Tauri' : 'Web preview'} />
        <FieldRow label="Zoom" value={`${Math.round(zoom * 100)}%`} />
        <FieldRow label="Maximized" value={maximized === null ? 'Unknown' : maximized ? 'Yes' : 'No'} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => runWindowAction(tauri.window.zoomOut, 'Zoomed out.')}>
          Zoom out
        </Button>
        <Button variant="outline" size="sm" onClick={() => runWindowAction(tauri.window.resetZoom, 'Zoom reset.')}>
          Actual size
        </Button>
        <Button variant="outline" size="sm" onClick={() => runWindowAction(tauri.window.zoomIn, 'Zoomed in.')}>
          Zoom in
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runWindowAction(tauri.window.toggleMaximize, 'Toggled maximize.')}
        >
          <Maximize2 /> Toggle maximize
        </Button>
      </div>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const TrayDemo = () => {
  const { settings, updateSettings: saveSettings } = useSettingsForm()
  const [active, setActive] = useState(isTrayActive())
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const setTrayEnabled = async (enabled: boolean) => {
    try {
      const next = await saveSettings({ minimizeToTray: enabled })
      if (isTauri()) await applyTraySetting(next?.minimizeToTray ?? enabled)
      setActive(isTrayActive())
      setState({ kind: 'ok', message: enabled ? 'Tray enabled.' : 'Tray disabled.' })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel title="Tray lifecycle" description="Toggle the opt-in tray setting and rebuild its localized menu.">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="tray-toggle">Minimize to tray</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Windows and Linux close requests hide to tray when enabled.
          </p>
        </div>
        <Switch
          id="tray-toggle"
          checked={settings?.minimizeToTray ?? false}
          disabled={!settings}
          onCheckedChange={(checked) => void setTrayEnabled(checked)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            refreshTrayMenu()
              .then(() => setState({ kind: 'ok', message: 'Tray menu refreshed.' }))
              .catch((error) => setState({ kind: 'error', message: stringifyError(error) }))
          }
        >
          <Menu /> Refresh menu
        </Button>
      </div>
      <FieldRow label="Tray active" value={active ? 'Yes' : 'No'} />
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const NotificationsDemo = () => {
  const { settings, updateSettings: saveSettings } = useSettingsForm()
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const notify = async () => {
    try {
      const sent = await sendNotification({
        title: 'Showcase notification',
        body: 'Native notifications are routed through the Tauri notification plugin.',
      })
      setState({
        kind: sent ? 'ok' : 'error',
        message: sent ? 'Notification sent.' : 'Notifications are disabled or denied.',
      })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel
      title="Native notifications"
      description="Use the production notification helper with the persisted setting."
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="notification-toggle">Notifications enabled</Label>
        <Switch
          id="notification-toggle"
          checked={settings?.notifications ?? false}
          disabled={!settings}
          onCheckedChange={(checked) => void saveSettings({ notifications: checked })}
        />
      </div>
      <Button size="sm" onClick={() => void notify()}>
        <Bell /> Send test notification
      </Button>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const ShortcutsDemo = () => {
  const shortcutApi = useConveyor('shortcut')
  const openPalette = useCommandPaletteStore((s) => s.setOpen)
  const [shortcuts, setShortcuts] = useState<{ id: string; accelerator: string; description: string }[]>([])
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const loadShortcuts = useCallback(() => {
    shortcutApi
      .list()
      .then((next) => {
        setShortcuts(next)
        setState({ kind: 'ok', message: 'Shortcut map loaded.' })
      })
      .catch((error) => setState({ kind: 'error', message: stringifyError(error) }))
  }, [shortcutApi])

  useEffect(loadShortcuts, [loadShortcuts])

  return (
    <DemoPanel
      title="Command palette and shortcuts"
      description="Inspect persisted accelerators and open the shared palette."
    >
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <FieldRow
            key={shortcut.id}
            label={shortcut.description}
            value={
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
                {formatAcceleratorForDisplay(shortcut.accelerator)}
              </kbd>
            }
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openPalette(true)}>
          <Search /> Open palette
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/settings?tab=shortcuts">Edit shortcuts</Link>
        </Button>
      </div>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const ThemeI18nDemo = () => {
  const { settings, updateSettings: saveSettings } = useSettingsForm()
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const updateLocale = async (locale: 'system' | SupportedLanguage) => {
    try {
      if (!(await saveSettings({ locale }))) return
      const effective = locale === 'system' ? resolveSupportedLanguage(navigator.language) : locale
      await changeLanguage(effective)
      setState({ kind: 'ok', message: `Language changed to ${effective}. Native menus will rebuild in Tauri.` })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    try {
      const next = await saveSettings({ theme })
      if (next) applyThemePreference(next.theme)
      setState({ kind: 'ok', message: `Theme changed to ${theme}.` })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  const updateAccent = async (accent: AccentPreference) => {
    try {
      const next = await saveSettings({ accentColor: accent })
      if (next) applyAccentPreference(next.accentColor)
      setState({ kind: 'ok', message: `Accent changed to ${accent}.` })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel
      title="Theme and language"
      description="Change persisted preferences and see the renderer update immediately."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select
            value={settings?.theme ?? 'system'}
            onValueChange={(value) => void updateTheme(value as 'light' | 'dark' | 'system')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Accent</Label>
          <Select
            value={settings?.accentColor ?? 'default'}
            onValueChange={(value) => void updateAccent(value as AccentPreference)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['default', 'blue', 'violet', 'green', 'rose', 'amber'].map((accent) => (
                <SelectItem key={accent} value={accent}>
                  {accent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select
            value={settings?.locale ?? 'system'}
            onValueChange={(value) => void updateLocale(value as 'system' | SupportedLanguage)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const DeepLinksDemo = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<RunState>({ kind: 'idle' })
  const sampleLinks = useMemo(
    () => [
      `${PROTOCOL_SCHEME}://showcase/file`,
      `${PROTOCOL_SCHEME}://showcase/deep-links`,
      `${PROTOCOL_SCHEME}://settings`,
    ],
    []
  )

  const dispatchSample = (url: string) => {
    const intent = parseDeepLinkUrl(url)
    if (!intent) {
      setState({ kind: 'error', message: 'The sample URL did not pass the route whitelist.' })
      return
    }
    appIntents.dispatch(intent)
    setState({ kind: 'ok', message: `Dispatched ${intent.route}.` })
  }

  return (
    <DemoPanel
      title="Deep links"
      description="Parse protocol URLs through the same route whitelist as the Tauri deep-link plugin."
    >
      <div className="space-y-2">
        {sampleLinks.map((url) => (
          <div key={url} className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={() => dispatchSample(url)}>
              Open
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
        Dispatch renderer navigation
      </Button>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const SecureStorageDemo = () => {
  const [secret, setSecret] = useState(DEMO_SECRET_DEFAULT)
  const [stored, setStored] = useState<string | null>(null)
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const secureAction = async (action: 'set' | 'get' | 'delete') => {
    try {
      if (action === 'set') {
        const result = await tauri.secure.set(DEMO_SECRET_KEY, secret)
        if (!result.ok) throw new Error(result.error?.message ?? 'Could not store secret')
        setState({ kind: 'ok', message: 'Demo secret stored in the OS keychain.' })
      } else if (action === 'get') {
        const result = await tauri.secure.get(DEMO_SECRET_KEY)
        if (!result.ok) throw new Error(result.error?.message ?? 'Could not read secret')
        setStored(result.value)
        setState({ kind: 'ok', message: result.value ? 'Demo secret loaded.' : 'No demo secret is stored.' })
      } else {
        const result = await tauri.secure.delete(DEMO_SECRET_KEY)
        if (!result.ok) throw new Error(result.error?.message ?? 'Could not delete secret')
        setStored(null)
        setState({ kind: 'ok', message: 'Demo secret deleted.' })
      }
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel
      title="Secure storage"
      description="Use a dedicated showcase key so real auth and license secrets stay untouched."
    >
      <div className="space-y-2">
        <Label htmlFor="showcase-secret">Secret value</Label>
        <Input id="showcase-secret" value={secret} onChange={(event) => setSecret(event.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void secureAction('set')}>
          <ShieldCheck /> Store
        </Button>
        <Button variant="outline" size="sm" onClick={() => void secureAction('get')}>
          Read
        </Button>
        <Button variant="outline" size="sm" onClick={() => void secureAction('delete')}>
          <Trash2 /> Delete
        </Button>
      </div>
      <FieldRow label="Stored preview" value={stored ? '*'.repeat(Math.min(stored.length, 12)) : 'Empty'} />
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const BackupDiagnosticsDemo = () => {
  const { settings, updateSettings: saveSettings } = useSettingsForm()
  const [diagnostics, setDiagnostics] = useState<string>('')
  const [logTail, setLogTail] = useState<string>('')
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const run = async (action: () => Promise<string>, success: string) => {
    try {
      const detail = await action()
      setState({ kind: 'ok', message: detail || success })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel
      title="Settings, backup, logs, diagnostics"
      description="Exercise the local persistence and support surfaces."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Notifications" value={settings?.notifications ? 'On' : 'Off'} />
        <FieldRow label="Recent files" value={settings?.recentFiles.length ?? 0} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void saveSettings({ notifications: !(settings?.notifications ?? false) })}
          disabled={!settings}
        >
          Toggle notifications
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void run(async () => (await exportSettingsBackup()).path ?? 'Export canceled.', 'Backup exported.')
          }
        >
          <Download /> Export backup
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void run(async () => {
              const result = await importSettingsBackup()
              return result.status === 'ok'
                ? 'Backup imported.'
                : result.status === 'canceled'
                  ? 'Import canceled.'
                  : result.message
            }, 'Backup imported.')
          }
        >
          <Upload /> Import backup
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void run(async () => {
              const next = await tauri.diagnostics.get()
              setDiagnostics(formatJson(next))
              return 'Diagnostics generated.'
            }, 'Diagnostics generated.')
          }
        >
          <ClipboardList /> Diagnostics
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void run(async () => {
              const next = await tauri.logs.tail(80)
              setLogTail(next || 'No log lines yet.')
              return 'Log tail loaded.'
            }, 'Log tail loaded.')
          }
        >
          <FileText /> Read logs
        </Button>
      </div>
      {diagnostics && <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{diagnostics}</pre>}
      {logTail && <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{logTail}</pre>}
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const FileEditorDemo = () => {
  const [path, setPath] = useState<string | null>(null)
  const [text, setText] = useState('Welcome to the Tauri file demo.\n')
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const openFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Text', extensions: ['txt', 'md', 'json', 'log'] }],
      })
      if (!selected || Array.isArray(selected)) {
        setState({ kind: 'ok', message: 'Open canceled.' })
        return
      }
      const next = await readTextFile(selected)
      setPath(selected)
      setText(next)
      const settings = await getSettings()
      await updateSettings({ recentFiles: [selected, ...settings.recentFiles.filter((entry) => entry !== selected)] })
      setState({ kind: 'ok', message: `Opened ${selected}.` })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  const saveFile = async () => {
    try {
      const target =
        path ??
        (await save({
          title: 'Save showcase file',
          defaultPath: 'showcase.txt',
          filters: [{ name: 'Text', extensions: ['txt', 'md'] }],
        }))
      if (!target) {
        setState({ kind: 'ok', message: 'Save canceled.' })
        return
      }
      await writeTextFile(target, text)
      setPath(target)
      const settings = await getSettings()
      await updateSettings({ recentFiles: [target, ...settings.recentFiles.filter((entry) => entry !== target)] })
      setState({ kind: 'ok', message: `Saved ${target}.` })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel title="File editor" description="Open and save text files through the Tauri dialog and fs plugins.">
      <FieldRow label="Current file" value={path ?? 'Unsaved draft'} />
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-56 w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void openFile()}>
          <FileText /> Open
        </Button>
        <Button size="sm" onClick={() => void saveFile()}>
          <Save /> Save
        </Button>
      </div>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const OnboardingReplayDemo = () => {
  const [visible, setVisible] = useState(false)
  return (
    <DemoPanel title="Onboarding replay" description="Render the same onboarding flow used by the first-run gate.">
      <Button size="sm" onClick={() => setVisible(true)}>
        Replay onboarding
      </Button>
      {visible && (
        <Onboarding
          eula={eulaConfig}
          onComplete={() => setVisible(false)}
          openExternal={(url) => void tauri.app.openExternal(url)}
        />
      )}
    </DemoPanel>
  )
}

const NativeMenuDemo = () => {
  const [state, setState] = useState<RunState>({ kind: 'idle' })

  const rebuild = async () => {
    try {
      await installAppMenu(await tauri.app.platform())
      await refreshTrayMenu()
      setState({ kind: 'ok', message: 'Native menu and tray labels rebuilt.' })
    } catch (error) {
      setState({ kind: 'error', message: stringifyError(error) })
    }
  }

  return (
    <DemoPanel title="Native menus" description="Rebuild JS-defined native menus using the current i18n language.">
      <Button size="sm" onClick={() => void rebuild()}>
        <Languages /> Rebuild menu labels
      </Button>
      <StatusLine state={state} />
    </DemoPanel>
  )
}

const demoFor = (id: string): ReactNode => {
  switch (id) {
    case 'window-state':
    case 'titlebar-controls':
      return <WindowDemo />
    case 'tray':
      return <TrayDemo />
    case 'notifications':
      return <NotificationsDemo />
    case 'global-shortcuts':
    case 'command-palette':
      return <ShortcutsDemo />
    case 'theme-accent':
    case 'i18n-switch':
      return <ThemeI18nDemo />
    case 'deep-links':
      return <DeepLinksDemo />
    case 'native-menu':
      return <NativeMenuDemo />
    case 'secure-storage':
      return <SecureStorageDemo />
    case 'settings-persistence':
    case 'backup-restore':
    case 'diagnostics-report':
    case 'structured-logs':
      return <BackupDiagnosticsDemo />
    case 'file':
    case 'file-dialogs':
      return <FileEditorDemo />
    case 'onboarding-replay':
      return <OnboardingReplayDemo />
    default:
      return null
  }
}

export const DemoRoute = () => {
  const { demoId } = useParams()
  if (!demoId) return <ShowcasePage />

  const capability = capabilityForRoute(`/showcase/${demoId}`)
  if (!capability) return <ShowcasePage />

  return <DemoLayout capability={capability}>{demoFor(demoId)}</DemoLayout>
}
