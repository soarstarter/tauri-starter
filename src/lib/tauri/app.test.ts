import { afterEach, describe, expect, it } from 'vitest'
import { clearTauriMocks, mockTauriCommands } from '../../../test/tauri-mock'
import { appApi } from './app'

afterEach(() => {
  clearTauriMocks()
})

describe('appApi', () => {
  it('version() returns the value from the command', async () => {
    mockTauriCommands({ version: () => '1.2.3' })
    await expect(appApi.version()).resolves.toBe('1.2.3')
  })

  it('platform() returns the value from the command', async () => {
    mockTauriCommands({ platform: () => 'macos' })
    await expect(appApi.platform()).resolves.toBe('macos')
  })

  it('openExternal() resolves on an ok Result', async () => {
    let opened: string | undefined
    mockTauriCommands({
      open_external: (args) => {
        opened = args.url as string
        return null
      },
    })
    await expect(appApi.openExternal('https://example.com')).resolves.toBeNull()
    expect(opened).toBe('https://example.com')
  })

  it('openExternal() rejects when the command errors', async () => {
    // A Tauri command `Err(String)` surfaces as a rejected invoke with a
    // non-Error value; the binding turns it into an error Result, which the
    // wrapper unwraps into a thrown Error.
    mockTauriCommands({
      open_external: () => {
        throw 'refusing to open non-https URL'
      },
    })
    await expect(appApi.openExternal('ftp://nope')).rejects.toThrow(/refusing to open non-https/)
  })
})
