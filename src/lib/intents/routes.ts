// The navigation-route whitelist shared by deep links (Phase 3.4), argv intents
// (Phase 3.3), and the native menu/tray actions (Phase 3.5). It mirrors the
// Electron template's `navigationRouteSchema`: any route arriving from outside
// the app (a `tauri-starter://` URL, a `--route=` flag, a second-instance launch) is
// validated against this list and dropped if it does not match, so external
// input can never steer the app to an arbitrary path.
//
// Kept as a plain `const` tuple rather than a Zod enum: the template reserves Zod
// for settings/forms validation, and this whitelist only needs membership
// checks. The router (Phase 5) consumes the same list so its routes cannot drift
// from what deep links accept.

export const NAVIGATION_ROUTES = [
  '/home',
  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  '/showcase',
  '/showcase/backup-restore',
  '/showcase/components',
  '/showcase/command-palette',
  '/showcase/deep-links',
  '/showcase/diagnostics-report',
  '/showcase/file',
  '/showcase/global-shortcuts',
  '/showcase/i18n-switch',
  '/showcase/native-menu',
  '/showcase/notifications',
  '/showcase/onboarding-replay',
  '/showcase/secure-storage',
  '/showcase/settings-persistence',
  '/showcase/structured-logs',
  '/showcase/theme-accent',
  '/showcase/titlebar-controls',
  '/showcase/tray',
  '/showcase/window-state',
  '/settings',
  '/about',
  '/logs',
] as const

export type NavigationRoute = (typeof NAVIGATION_ROUTES)[number]

const ROUTE_SET: ReadonlySet<string> = new Set(NAVIGATION_ROUTES)

/** Type guard: `true` only for a string that is exactly one of the whitelisted routes. */
export const isNavigationRoute = (value: unknown): value is NavigationRoute =>
  typeof value === 'string' && ROUTE_SET.has(value)

/** A validated request to navigate the app to a whitelisted route. */
export interface NavigateIntent {
  readonly type: 'navigate'
  readonly route: NavigationRoute
}

/**
 * A parsed, validated app intent. A discriminated union (currently only
 * `navigate`) so new intent kinds can be added without touching call sites,
 * mirroring the Electron template's `appIntentSchema`.
 */
export type AppIntent = NavigateIntent
