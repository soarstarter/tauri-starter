import { getCurrent as getCurrentDeepLinkUrls, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { onTauriEvent } from '@/lib/tauri/events'
import { appIntents } from './dispatcher'
import { parseArgvForIntents, parseDeepLinkUrls } from './parse'

export * from './routes'
export * from './parse'
export { AppIntentDispatcher, appIntents, type IntentHandler } from './dispatcher'

/**
 * Wire the external intent sources into the {@link appIntents} dispatcher:
 *
 *   - single-instance launches (Phase 3.3) — the Rust callback focuses the
 *     window and emits the new process's argv, which we parse for `--route=` /
 *     `tauri-starter://` intents,
 *   - deep links (Phase 3.4) — cold-start URLs via `getCurrent()` and runtime
 *     URLs via `onOpenUrl()`.
 *
 * Call once at boot. Returns a cleanup function that removes every listener.
 * Safe to call in a browser/test context: dynamic failures (no Tauri host) are
 * swallowed so unit tests importing the module do not need a running shell.
 */
export async function initAppIntents(): Promise<() => void> {
  const unlisteners: Array<() => void> = []

  const unlistenSingleInstance = await onTauriEvent('single-instance', (argv) => {
    appIntents.dispatchMany(parseArgvForIntents(argv))
  })
  unlisteners.push(unlistenSingleInstance)

  const unlistenDeepLink = await onOpenUrl((urls) => {
    appIntents.dispatchMany(parseDeepLinkUrls(urls))
  })
  unlisteners.push(unlistenDeepLink)

  // Cold-start deep link: the app was launched by opening a `tauri-starter://` URL.
  const initialUrls = await getCurrentDeepLinkUrls()
  if (initialUrls && initialUrls.length > 0) {
    appIntents.dispatchMany(parseDeepLinkUrls(initialUrls))
  }

  return () => {
    for (const unlisten of unlisteners) unlisten()
  }
}
