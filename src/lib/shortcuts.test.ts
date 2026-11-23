import { beforeEach, describe, expect, it, vi } from 'vitest'

const { register, unregisterAll, getSettings } = vi.hoisted(() => ({
  register: vi.fn(),
  unregisterAll: vi.fn(),
  getSettings: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-global-shortcut', () => ({ register, unregisterAll }))
vi.mock('./settings/store', () => ({ getSettings, updateSettings: vi.fn() }))
vi.mock('@/lib/intents', () => ({ appIntents: { dispatch: vi.fn() } }))

import { registerGlobalShortcuts, SHORTCUTS } from './shortcuts'

beforeEach(() => {
  vi.clearAllMocks()
  getSettings.mockResolvedValue({ shortcuts: {} })
})

describe('SHORTCUTS', () => {
  it('keeps the built-in shortcuts in-window', () => {
    expect(SHORTCUTS.map((shortcut) => [shortcut.id, shortcut.scope])).toEqual([
      ['palette.open', 'in-window'],
      ['open-settings', 'in-window'],
    ])
  })
})

describe('registerGlobalShortcuts', () => {
  it('clears earlier registrations and does not take in-window shortcuts away from other apps', async () => {
    await registerGlobalShortcuts()

    expect(unregisterAll).toHaveBeenCalledTimes(1)
    expect(register).not.toHaveBeenCalled()
  })
})
