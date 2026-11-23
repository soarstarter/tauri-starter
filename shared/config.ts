// Centralized env-read hub. All frontend-facing configuration is read here once
// so buyers have a single place to toggle whole subsystems and so the rest of
// the app never touches `import.meta.env` directly.
//
// Reads `import.meta.env` (Vite) when available so the frontend picks up `VITE_*`
// values; falls back to an empty env in any non-Vite context (the Rust side is
// separate, bare Node, unit tests) where these flags are not relevant.

type EnvRecord = Record<string, unknown> | undefined

const viteEnv: EnvRecord = (() => {
  try {
    return import.meta.env as unknown as Record<string, unknown>
  } catch {
    return undefined
  }
})()

/**
 * Coerce a Vite env value to a boolean. Accepts `true`/`"true"`/`"1"` as on and
 * `false`/`"false"`/`"0"` as off; anything unset (or unrecognized) resolves to
 * `fallback`. Pure and `env`-injected so the branch matrix is unit-testable.
 */
export const readFlag = (env: EnvRecord, name: string, fallback: boolean): boolean => {
  const raw = env?.[name]
  if (raw === true || raw === 'true' || raw === '1') return true
  if (raw === false || raw === 'false' || raw === '0') return false
  return fallback
}

/**
 * Read a non-empty string env value, or `''` when unset/blank/non-string. Pure
 * and `env`-injected so it stays unit-testable alongside {@link readFlag}.
 */
export const readString = (env: EnvRecord, name: string): string => {
  const raw = env?.[name]
  return typeof raw === 'string' && raw.trim() !== '' ? raw : ''
}

/**
 * Module feature flags so a buyer can strip whole subsystems from a build via
 * `.env`. `showcase` defaults ON.
 */
export const features = {
  /**
   * [template-demo] Template showcase and demo catalog surfaces. TS is the
   * single source of truth: this value is pushed to the Rust side once at boot
   * (Phase 2) so native menus/tray can hide with it — no MAIN_VITE_* duplication.
   */
  showcase: readFlag(viteEnv, 'VITE_SHOWCASE_ENABLED', true),
} as const

/**
 * [template-demo]
 * Showcase-specific config. `enabled` mirrors {@link features.showcase}; kept
 * as a dedicated export so template/demo UI can disappear behind one switch.
 */
export const showcaseConfig = {
  /** Master switch for the template showcase catalog and demo surfaces. */
  enabled: features.showcase,
} as const
