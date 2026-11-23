import { listen, type Event, type UnlistenFn } from '@tauri-apps/api/event'

/**
 * Payload types for the events the Rust side emits, keyed by event name. This is
 * the frontend counterpart to the Electron template's `event-schema.ts`. It
 * grows as later phases start emitting events (navigation intents — Phase 3,
 * settings-changed — Phase 4), giving every `listen()` call a compiler-checked
 * payload type.
 */
export interface TauriEventMap {
  /**
   * A second launch was folded into the running instance (Phase 3.3). Payload is
   * the raw argv of that launch; the intent wiring parses it against the
   * navigation-route whitelist. Emitted by the Rust single-instance callback.
   */
  'single-instance': string[]
  'settings-changed': import('@/lib/settings/schema').AppSettings
}

export type TauriEventName = keyof TauriEventMap & string

/**
 * Subscribe to a registered Tauri event with a typed payload. Returns the
 * unlisten function. Prefer this over calling `listen()` directly so payloads
 * stay checked against {@link TauriEventMap}.
 */
export function onTauriEvent<E extends TauriEventName>(
  name: E,
  handler: (payload: TauriEventMap[E]) => void
): Promise<UnlistenFn> {
  return listen<TauriEventMap[E]>(name, (event) => handler(event.payload))
}

/**
 * Escape hatch for events whose payload type isn't in {@link TauriEventMap}
 * yet. Prefer {@link onTauriEvent} once the event is registered there.
 */
export function onTauriEventRaw<T>(name: string, handler: (payload: T, event: Event<T>) => void): Promise<UnlistenFn> {
  return listen<T>(name, (event) => handler(event.payload, event))
}
