import { describe, expect, it, vi } from 'vitest'

// Mock the low-level listen() so we test our wrapper's behavior (name passthrough
// + payload unwrapping) without a running Tauri event bus.
const { mockListen } = vi.hoisted(() => ({ mockListen: vi.fn() }))
vi.mock('@tauri-apps/api/event', () => ({ listen: mockListen }))

import { onTauriEventRaw } from './events'

describe('onTauriEventRaw', () => {
  it('subscribes by name and forwards the unwrapped payload', async () => {
    let captured: ((event: unknown) => void) | undefined
    const unlisten = vi.fn()
    mockListen.mockImplementation((_name: string, cb: (event: unknown) => void) => {
      captured = cb
      return Promise.resolve(unlisten)
    })

    const handler = vi.fn()
    const result = await onTauriEventRaw<{ hello: string }>('demo-event', handler)

    expect(mockListen).toHaveBeenCalledWith('demo-event', expect.any(Function))
    expect(result).toBe(unlisten)

    const event = { event: 'demo-event', id: 1, payload: { hello: 'world' } }
    captured?.(event)
    expect(handler).toHaveBeenCalledWith({ hello: 'world' }, event)
  })
})
