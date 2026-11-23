import { describe, expect, it } from 'vitest'
import { APP_ID } from '@/shared/constants'
import { DEFAULT_SETTINGS, CURRENT_SETTINGS_VERSION } from './store'
import { buildBackup, parseBackup } from './backup'

describe('settings backup', () => {
  it('builds a validated settings-only backup with secure key names', () => {
    const backup = buildBackup({
      appId: APP_ID,
      appVersion: '1.2.3',
      settingsVersion: CURRENT_SETTINGS_VERSION,
      settings: DEFAULT_SETTINGS,
      secureKeysPresent: ['access-token'],
      now: new Date('2026-01-02T03:04:05.000Z'),
    })

    expect(backup).toMatchObject({
      kind: 'settings-backup',
      formatVersion: 1,
      appId: APP_ID,
      appVersion: '1.2.3',
      exportedAt: '2026-01-02T03:04:05.000Z',
      secureKeysPresent: ['access-token'],
    })
    expect(parseBackup(backup)).toEqual(backup)
  })

  it('imports a backup that lists settings and secure keys this build does not know', () => {
    const backup = buildBackup({
      appId: APP_ID,
      appVersion: '1.2.3',
      settingsVersion: CURRENT_SETTINGS_VERSION,
      settings: DEFAULT_SETTINGS,
      secureKeysPresent: ['access-token'],
    })

    const parsed = parseBackup({
      ...backup,
      settings: { ...backup.settings, retiredFlag: true },
      secureKeysPresent: ['access-token', 'retired-key'],
    })

    expect(parsed.settings).toEqual(DEFAULT_SETTINGS)
    expect(parsed.secureKeysPresent).toEqual(['access-token'])
  })

  it('rejects malformed backup files', () => {
    expect(() => parseBackup({ kind: 'settings-backup', settings: { theme: 'neon' } })).toThrow()
  })
})
