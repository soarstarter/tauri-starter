import { afterEach, describe, expect, it } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { clearTauriMocks, mockTauriCommands } from './tauri-mock'

afterEach(() => {
  clearTauriMocks()
})

describe('mockTauriCommands', () => {
  it('routes invoke() calls to the registered handler', async () => {
    mockTauriCommands({
      greet: (args) => `hello ${args.name}`,
    })

    await expect(invoke('greet', { name: 'world' })).resolves.toBe('hello world')
  })

  it('throws for unregistered commands', async () => {
    mockTauriCommands({})
    await expect(invoke('missing')).rejects.toThrow(/No mock registered/)
  })
})
