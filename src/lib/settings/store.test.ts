import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applySettingsPatch,
  clampZoomLevel,
  CURRENT_SETTINGS_VERSION,
  DEFAULT_SETTINGS,
  pushRecentFile,
  SettingsStore,
  type SettingsStorage,
} from './store'
import type { AppSettings } from './schema'

vi.mock('@tauri-apps/api/event', () => ({ emit: vi.fn() }))
vi.mock('@tauri-apps/plugin-autostart', () => ({ enable: vi.fn(), disable: vi.fn() }))

class MemorySettingsStorage implements SettingsStorage {
  values = new Map<string, unknown>()

  constructor(initial?: Record<string, unknown>) {
    for (const [key, value] of Object.entries(initial ?? {})) this.values.set(key, value)
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

  async save(): Promise<void> {}
}

const createStore = async (initial?: Record<string, unknown>) => SettingsStore.load(new MemorySettingsStorage(initial))

afterEach(() => {
  vi.clearAllMocks()
})

describe('SettingsStore', () => {
  it('writes defaults under the current envelope version on first load', async () => {
    const storage = new MemorySettingsStorage()
    const store = await SettingsStore.load(storage)

    expect(store.get()).toEqual(DEFAULT_SETTINGS)
    expect(await storage.get('version')).toBe(CURRENT_SETTINGS_VERSION)
    expect(await storage.get('settings')).toEqual(DEFAULT_SETTINGS)
  })

  it('persists patches and deep-merges nested settings', async () => {
    const store = await createStore()

    await store.update({ proxy: { mode: 'custom', url: 'http://proxy.local:8080' }, window: { menusVisible: false } })
    await store.update({ theme: 'light', proxy: { url: 'http://proxy.local:9090' } })

    expect(store.get().theme).toBe('light')
    expect(store.get().proxy).toEqual({ mode: 'custom', url: 'http://proxy.local:9090' })
    expect(store.get().window).toEqual({ menusVisible: false })
  })

  it('clears nullable settings and clamps zoom levels', async () => {
    const store = await createStore()

    await store.update({
      proxy: { mode: 'custom', url: 'http://x.local:1' },
      dataDir: '/tmp/tauri-starter',
      zoomLevel: 99,
    })
    expect(store.get().zoomLevel).toBe(3)

    await store.update({ proxy: { url: null }, dataDir: null, zoomLevel: -99 })
    expect(store.get().proxy.url).toBeUndefined()
    expect(store.get().dataDir).toBeUndefined()
    expect(store.get().zoomLevel).toBe(-3)
  })

  it('restore and reset replace the whole settings object', async () => {
    const store = await createStore()
    const restored: AppSettings = { ...DEFAULT_SETTINGS, theme: 'light', notifications: false }

    await store.restore(restored)
    expect(store.get()).toEqual(restored)

    await store.reset()
    expect(store.get()).toEqual(DEFAULT_SETTINGS)
  })

  it('migrates a v1 envelope forward by filling in new defaults', async () => {
    const store = await createStore({
      version: 1,
      settings: { theme: 'system', window: { menusVisible: false } },
    })

    expect(store.get()).toEqual({ ...DEFAULT_SETTINGS, theme: 'system', window: { menusVisible: false } })
  })

  it('migrates a legacy unversioned store without losing values', async () => {
    const store = await createStore({ theme: 'system', window: { menusVisible: false } })

    expect(store.get()).toEqual({ ...DEFAULT_SETTINGS, theme: 'system', window: { menusVisible: false } })
  })

  it('drops keys the schema does not know instead of rejecting the store', async () => {
    const store = await createStore({
      version: CURRENT_SETTINGS_VERSION,
      settings: { ...DEFAULT_SETTINGS, theme: 'light', retiredFlag: true, retiredChannel: 'latest' },
    })

    expect(store.get()).toEqual({ ...DEFAULT_SETTINGS, theme: 'light' })
  })

  it('falls back to defaults when the stored version is newer than supported', async () => {
    const store = await createStore({ version: 99, settings: { theme: 'light' } })

    expect(store.get()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('settings helpers', () => {
  it('clamps zoom levels to the supported range', () => {
    expect(clampZoomLevel(-99)).toBe(-3)
    expect(clampZoomLevel(99)).toBe(3)
    expect(clampZoomLevel(1.5)).toBe(1.5)
  })

  it('prepends recent files newest-first, dedupes, caps, and ignores blanks', () => {
    let list: string[] = []
    for (let i = 1; i <= 12; i++) list = pushRecentFile(list, `/docs/file-${i}.txt`)

    expect(list).toHaveLength(10)
    expect(list[0]).toBe('/docs/file-12.txt')
    expect(list).not.toContain('/docs/file-1.txt')
    expect(pushRecentFile(list, '/docs/file-5.txt')[0]).toBe('/docs/file-5.txt')
    expect(pushRecentFile(['/a.txt'], '   ')).toEqual(['/a.txt'])
  })

  it('keeps patch application pure', () => {
    const next = applySettingsPatch(DEFAULT_SETTINGS, { window: { menusVisible: false } })
    expect(DEFAULT_SETTINGS.window.menusVisible).toBe(true)
    expect(next.window.menusVisible).toBe(false)
  })
})
