import { PROTOCOL_SCHEME } from '@/shared/constants'
import { isNavigationRoute, type AppIntent } from './routes'

// Port of the Electron template's `argv-intents.ts`, extended with a deep-link
// URL parser. Two external sources feed navigation intents into the app:
//   - a second launch's argv (single-instance, Phase 3.3) — `--route=/x` flags
//     and bare `tauri-starter://x` URLs,
//   - deep-link URLs (Phase 3.4) — `tauri-starter://x` from `getCurrent()`/`onOpenUrl()`.
// Both funnel through `extractProtocolRoute`, then the navigation-route
// whitelist, so anything unrecognized is silently dropped.

const ROUTE_FLAG = /^--route=(.+)$/
const PROTOCOL_PREFIX = `${PROTOCOL_SCHEME}://`

/** Extract the `/route` path from a `tauri-starter://route?query#hash` URL, or `null`. */
const extractProtocolRoute = (arg: string): string | null => {
  if (!arg.startsWith(PROTOCOL_PREFIX)) return null
  const rest = arg.slice(PROTOCOL_PREFIX.length).split(/[?#]/)[0] ?? ''
  const trimmed = rest.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!trimmed) return null
  return '/' + trimmed
}

/** Extract a candidate route from a single argv entry (`--route=` or `tauri-starter://`). */
const extractRoute = (arg: string): string | null => {
  const routeMatch = ROUTE_FLAG.exec(arg)
  if (routeMatch) return routeMatch[1] ?? null
  return extractProtocolRoute(arg)
}

/** Validate a candidate route into a navigate intent, or `null` if not whitelisted. */
const toNavigateIntent = (route: string | null): AppIntent | null =>
  isNavigationRoute(route) ? { type: 'navigate', route } : null

/** Parse a process argv array into ordered, validated navigate intents. */
export const parseArgvForIntents = (argv: readonly string[]): AppIntent[] => {
  const intents: AppIntent[] = []
  for (const arg of argv) {
    const intent = toNavigateIntent(extractRoute(arg))
    if (intent) intents.push(intent)
  }
  return intents
}

/** Parse a single `tauri-starter://` deep-link URL into a navigate intent, or `null`. */
export const parseDeepLinkUrl = (url: string): AppIntent | null => toNavigateIntent(extractProtocolRoute(url))

/** Parse a batch of deep-link URLs, preserving order and dropping invalid ones. */
export const parseDeepLinkUrls = (urls: readonly string[]): AppIntent[] =>
  urls.map(parseDeepLinkUrl).filter((intent): intent is AppIntent => intent !== null)
