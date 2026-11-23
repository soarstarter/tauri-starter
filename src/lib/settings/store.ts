import { Store } from '@tauri-apps/plugin-store'
import { disable as disableAutostart, enable as enableAutostart } from '@tauri-apps/plugin-autostart'
import { emit } from '@tauri-apps/api/event'
import { isTauri } from '@tauri-apps/api/core'
import { PRODUCT_SLUG } from '@/shared/constants'
import {
  appSettingsPatchSchema,
  appSettingsSchema,
  MAX_RECENT_FILES,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  type AppSettings,
  type AppSettingsPatch,
  type ProxySettingsPatch,
  type WindowSettingsPatch,
} from './schema'

export const CURRENT_SETTINGS_VERSION = 10
const SETTINGS_STORE_PATH = 'settings.json'
const VERSION_KEY = 'version'
const SETTINGS_KEY = 'settings'
export const SETTINGS_CHANGED_EVENT = 'settings-changed'

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'default',
  zoomLevel: 0,
  locale: 'system',
  launchAtLogin: false,
  minimizeToTray: false,
  notifications: true,
  proxy: { mode: 'system' },
  window: { menusVisible: true },
  shortcuts: {},
  recentFiles: [],
  onboardingCompleted: false,
  eulaAcceptedVersion: 0,
}

type RawSettings = Record<string, unknown>
type PersistedEnvelope = { version: number; settings: RawSettings }

export interface SettingsStorage {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<boolean>
  save(): Promise<void>
}

const storeCache = new Map<string, Promise<TauriStoreStorage>>()

class TauriStoreStorage implements SettingsStorage {
  private constructor(private readonly store: Store) {}

  static async load(path = SETTINGS_STORE_PATH): Promise<TauriStoreStorage> {
    const store = await Store.load(path, {
      defaults: { [VERSION_KEY]: CURRENT_SETTINGS_VERSION, [SETTINGS_KEY]: DEFAULT_SETTINGS },
      autoSave: false,
    })
    return new TauriStoreStorage(store)
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.store.get<T>(key)
  }

  set(key: string, value: unknown): Promise<void> {
    return this.store.set(key, value)
  }

  delete(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  save(): Promise<void> {
    return this.store.save()
  }
}

class BrowserSettingsStorage implements SettingsStorage {
  private values = new Map<string, unknown>()

  constructor(private readonly path: string) {
    const raw = window.localStorage.getItem(`${PRODUCT_SLUG}:${path}`)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      for (const [key, value] of Object.entries(parsed)) this.values.set(key, value)
    } catch {
      window.localStorage.removeItem(`${PRODUCT_SLUG}:${path}`)
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined
  }

  async set(key: string, value: unknown): Promise<void> {
    this.values.set(key, value)
  }

  async delete(key: string): Promise<boolean> {
    return this.values.delete(key)
  }

  async save(): Promise<void> {
    window.localStorage.setItem(`${PRODUCT_SLUG}:${this.path}`, JSON.stringify(Object.fromEntries(this.values)))
  }
}

export const getSettingsStorage = (path = SETTINGS_STORE_PATH): Promise<SettingsStorage> => {
  if (!isTauri()) return Promise.resolve(new BrowserSettingsStorage(path))
  const existing = storeCache.get(path)
  if (existing) return existing
  const created = TauriStoreStorage.load(path)
  storeCache.set(path, created)
  return created
}

const cloneSettings = (settings: AppSettings): AppSettings => appSettingsSchema.parse(structuredClone(settings))

export const pushRecentFile = (current: readonly string[], path: string): string[] => {
  const trimmed = path.trim()
  if (!trimmed) return [...current]
  return [trimmed, ...current.filter((entry) => entry !== trimmed)].slice(0, MAX_RECENT_FILES)
}

export const clampZoomLevel = (zoomLevel: number): number =>
  Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, zoomLevel))

// Versions 2, 4 and 6 introduced keys this app doesn't use; those steps are
// pass-throughs so the version numbers (and older settings files) stay valid.
// Keys the schema doesn't know are dropped when the result is validated.
const settingsMigrations: Record<number, (settings: RawSettings) => RawSettings> = {
  1: (v1) => ({
    theme: 'dark',
    locale: 'system',
    launchAtLogin: false,
    minimizeToTray: false,
    notifications: true,
    proxy: { mode: 'system' },
    window: { menusVisible: true },
    ...v1,
  }),
  2: (v2) => v2,
  3: (v3) => ({ ...v3, shortcuts: {} }),
  4: (v4) => v4,
  5: (v5) => ({ ...v5, recentFiles: [] }),
  6: (v6) => v6,
  7: (v7) => ({ ...v7, accentColor: 'default' }),
  8: (v8) => ({ ...v8, onboardingCompleted: false, eulaAcceptedVersion: 0 }),
  9: (v9) => ({ ...v9, zoomLevel: 0 }),
}

export const migrateSettingsForward = (raw: PersistedEnvelope): RawSettings => {
  let version = raw.version
  let settings = raw.settings
  while (version < CURRENT_SETTINGS_VERSION) {
    const migrator = settingsMigrations[version]
    if (!migrator) throw new Error(`No settings migration registered from version ${version}`)
    settings = migrator(settings)
    version += 1
  }
  return settings
}

const mergeProxy = (current: AppSettings['proxy'], patch: ProxySettingsPatch | undefined): AppSettings['proxy'] => {
  if (!patch) return current
  const next: AppSettings['proxy'] = { ...current }
  if (patch.mode !== undefined) next.mode = patch.mode
  if (patch.url === null) delete next.url
  else if (typeof patch.url === 'string') next.url = patch.url
  return next
}

const mergeWindow = (
  current: AppSettings['window'],
  patch: WindowSettingsPatch | undefined
): AppSettings['window'] => ({
  ...current,
  ...(patch?.menusVisible !== undefined && { menusVisible: patch.menusVisible }),
})

export const applySettingsPatch = (current: AppSettings, rawPatch: AppSettingsPatch): AppSettings => {
  const patch = appSettingsPatchSchema.parse(rawPatch)
  const next: AppSettings = { ...current }

  if (patch.theme !== undefined) next.theme = patch.theme
  if (patch.accentColor !== undefined) next.accentColor = patch.accentColor
  if (patch.zoomLevel !== undefined) next.zoomLevel = clampZoomLevel(patch.zoomLevel)
  if (patch.locale !== undefined) next.locale = patch.locale
  if (patch.launchAtLogin !== undefined) next.launchAtLogin = patch.launchAtLogin
  if (patch.minimizeToTray !== undefined) next.minimizeToTray = patch.minimizeToTray
  if (patch.notifications !== undefined) next.notifications = patch.notifications

  next.proxy = mergeProxy(current.proxy, patch.proxy)
  next.window = mergeWindow(current.window, patch.window)

  if (patch.shortcuts !== undefined) next.shortcuts = { ...patch.shortcuts }
  if (patch.recentFiles !== undefined) next.recentFiles = [...patch.recentFiles].slice(0, MAX_RECENT_FILES)
  if (patch.onboardingCompleted !== undefined) next.onboardingCompleted = patch.onboardingCompleted
  if (patch.eulaAcceptedVersion !== undefined) next.eulaAcceptedVersion = patch.eulaAcceptedVersion

  if (patch.dataDir === null) delete next.dataDir
  else if (typeof patch.dataDir === 'string') next.dataDir = patch.dataDir

  return appSettingsSchema.parse(next)
}

const normalizeLoadedSettings = async (storage: SettingsStorage): Promise<AppSettings> => {
  const version = await storage.get<number>(VERSION_KEY)
  const settings = await storage.get<RawSettings>(SETTINGS_KEY)

  if (typeof version === 'number' && settings && typeof settings === 'object') {
    if (version <= CURRENT_SETTINGS_VERSION) {
      const migrated = migrateSettingsForward({ version, settings })
      const validated = appSettingsSchema.safeParse(migrated)
      if (validated.success) return validated.data
    }
    return cloneSettings(DEFAULT_SETTINGS)
  }

  const legacyEntries = Object.fromEntries(
    (
      await Promise.all(
        Object.keys(DEFAULT_SETTINGS).map(async (key) => [key, await storage.get<unknown>(key)] as const)
      )
    ).filter(([, value]) => value !== undefined)
  )

  if (Object.keys(legacyEntries).length > 0) {
    const migrated = migrateSettingsForward({ version: 1, settings: legacyEntries })
    const validated = appSettingsSchema.safeParse(migrated)
    if (validated.success) return validated.data
  }

  return cloneSettings(DEFAULT_SETTINGS)
}

const persistSettings = async (storage: SettingsStorage, settings: AppSettings): Promise<void> => {
  await storage.set(VERSION_KEY, CURRENT_SETTINGS_VERSION)
  await storage.set(SETTINGS_KEY, settings)
  await storage.save()
}

const syncLaunchAtLogin = async (enabled: boolean): Promise<void> => {
  if (!isTauri()) return
  if (enabled) await enableAutostart()
  else await disableAutostart()
}

const emitSettingsChanged = async (settings: AppSettings): Promise<void> => {
  if (!isTauri()) return
  await emit(SETTINGS_CHANGED_EVENT, settings)
}

export class SettingsStore {
  private settings: AppSettings | undefined

  constructor(private readonly storage: SettingsStorage) {}

  static async load(storage?: SettingsStorage): Promise<SettingsStore> {
    const settingsStore = new SettingsStore(storage ?? (await getSettingsStorage()))
    await settingsStore.load()
    return settingsStore
  }

  async load(): Promise<AppSettings> {
    this.settings = await normalizeLoadedSettings(this.storage)
    await persistSettings(this.storage, this.settings)
    await syncLaunchAtLogin(this.settings.launchAtLogin)
    return this.get()
  }

  get(): AppSettings {
    if (!this.settings) throw new Error('settings store has not been loaded')
    return this.settings
  }

  async update(patch: AppSettingsPatch): Promise<AppSettings> {
    const previous = this.get()
    this.settings = applySettingsPatch(previous, patch)
    await persistSettings(this.storage, this.settings)
    if (previous.launchAtLogin !== this.settings.launchAtLogin) {
      await syncLaunchAtLogin(this.settings.launchAtLogin)
    }
    await emitSettingsChanged(this.settings)
    return this.get()
  }

  async reset(): Promise<AppSettings> {
    this.settings = cloneSettings(DEFAULT_SETTINGS)
    await persistSettings(this.storage, this.settings)
    await syncLaunchAtLogin(this.settings.launchAtLogin)
    await emitSettingsChanged(this.settings)
    return this.get()
  }

  async restore(settings: AppSettings): Promise<AppSettings> {
    this.settings = appSettingsSchema.parse(settings)
    await persistSettings(this.storage, this.settings)
    await syncLaunchAtLogin(this.settings.launchAtLogin)
    await emitSettingsChanged(this.settings)
    return this.get()
  }

  async addRecentFile(path: string): Promise<AppSettings> {
    const recentFiles = pushRecentFile(this.get().recentFiles, path)
    return this.update({ recentFiles })
  }

  async removeRecentFile(path: string): Promise<AppSettings> {
    const current = this.get()
    const recentFiles = current.recentFiles.filter((entry) => entry !== path)
    if (recentFiles.length === current.recentFiles.length) return current
    return this.update({ recentFiles })
  }
}

let settingsStorePromise: Promise<SettingsStore> | undefined

export const getSettingsStore = (): Promise<SettingsStore> => {
  settingsStorePromise ??= SettingsStore.load()
  return settingsStorePromise
}

export const getSettings = async (): Promise<AppSettings> => (await getSettingsStore()).get()
export const updateSettings = async (patch: AppSettingsPatch): Promise<AppSettings> =>
  (await getSettingsStore()).update(patch)
export const resetSettings = async (): Promise<AppSettings> => (await getSettingsStore()).reset()
export const restoreSettings = async (settings: AppSettings): Promise<AppSettings> =>
  (await getSettingsStore()).restore(settings)
