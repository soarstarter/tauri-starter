import { describe, expect, it, vi } from 'vitest'
import { AppIntentDispatcher } from './dispatcher'
import type { AppIntent } from './routes'

const navigate = (route: AppIntent['route']): AppIntent => ({ type: 'navigate', route })

describe('AppIntentDispatcher', () => {
  it('queues intents until a handler subscribes, then delivers each once', () => {
    const dispatcher = new AppIntentDispatcher()
    const handler = vi.fn()

    dispatcher.dispatch(navigate('/settings'))
    expect(handler).not.toHaveBeenCalled()

    dispatcher.subscribe(handler)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(navigate('/settings'))
  })

  it('delivers intents dispatched after subscription immediately', () => {
    const dispatcher = new AppIntentDispatcher()
    const handler = vi.fn()
    dispatcher.subscribe(handler)

    dispatcher.dispatch(navigate('/about'))
    expect(handler).toHaveBeenCalledWith(navigate('/about'))
  })

  it('preserves order across dispatchMany', () => {
    const dispatcher = new AppIntentDispatcher()
    const handler = vi.fn()
    dispatcher.subscribe(handler)

    dispatcher.dispatchMany([navigate('/home'), navigate('/logs')])
    expect(handler.mock.calls).toEqual([[navigate('/home')], [navigate('/logs')]])
  })

  it('does not replay delivered intents to a later subscriber', () => {
    const dispatcher = new AppIntentDispatcher()
    const first = vi.fn()
    dispatcher.subscribe(first)
    dispatcher.dispatch(navigate('/settings'))
    expect(first).toHaveBeenCalledTimes(1)

    const second = vi.fn()
    dispatcher.subscribe(second)
    expect(second).not.toHaveBeenCalled()
  })

  it('stops delivering after unsubscribe and re-queues for the next subscriber', () => {
    const dispatcher = new AppIntentDispatcher()
    const handler = vi.fn()
    const unsubscribe = dispatcher.subscribe(handler)
    unsubscribe()

    dispatcher.dispatch(navigate('/about'))
    expect(handler).not.toHaveBeenCalled()

    const next = vi.fn()
    dispatcher.subscribe(next)
    expect(next).toHaveBeenCalledWith(navigate('/about'))
  })
})
