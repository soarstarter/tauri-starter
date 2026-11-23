import type { AppIntent } from './routes'

export type IntentHandler = (intent: AppIntent) => void

/**
 * Frontend port of the Electron template's `AppIntentService`. The main process
 * used to queue intents until the renderer signalled readiness; here the renderer
 * *is* the consumer, so the dispatcher queues intents that arrive before the
 * router mounts (a cold-start deep link, or a single-instance launch that lands
 * during boot) and delivers each exactly once when a handler subscribes.
 *
 * Only one handler is active at a time — the app has a single router. Delivered
 * intents are drained from the queue so a later re-subscribe (e.g. after an HMR
 * remount) does not replay already-handled navigations.
 */
export class AppIntentDispatcher {
  private handler: IntentHandler | undefined
  private readonly pending: AppIntent[] = []

  /** Queue a single intent and deliver it if a handler is subscribed. */
  dispatch = (intent: AppIntent): void => {
    this.pending.push(intent)
    this.flush()
  }

  /** Queue a batch of intents in order and deliver any that can be. */
  dispatchMany = (intents: readonly AppIntent[]): void => {
    if (intents.length === 0) return
    this.pending.push(...intents)
    this.flush()
  }

  /**
   * Register the consumer (the router). Immediately drains any queued intents,
   * then receives future ones. Returns an unsubscribe function; subscribing
   * again replaces the handler.
   */
  subscribe = (handler: IntentHandler): (() => void) => {
    this.handler = handler
    this.flush()
    return () => {
      if (this.handler === handler) this.handler = undefined
    }
  }

  private flush = (): void => {
    while (this.handler && this.pending.length > 0) {
      const intent = this.pending.shift()
      if (intent) this.handler(intent)
    }
  }
}

/** App-wide singleton fed by the intent wiring (`initAppIntents`) and native menu/tray. */
export const appIntents = new AppIntentDispatcher()
