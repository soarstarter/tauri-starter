import { commands, type Result } from '@/lib/bindings'

/** Throw on an `error` Result, otherwise return the `ok` data. */
function unwrap<T>(result: Result<T, string>): T {
  if (result.status === 'error') throw new Error(result.error)
  return result.data
}

/**
 * `app` domain of the native API. Wraps the generated bindings so ported
 * Electron call sites change mechanically (`tauri.app.version()` →
 * `tauri.app.version()`) and so `Result`-returning commands surface errors as
 * rejected promises.
 */
export const appApi = {
  /** Running application version, from the bundle metadata. */
  version: () => commands.version(),
  /** Host platform identifier: `"macos"` | `"windows"` | `"linux"` | …. */
  platform: () => commands.platform(),
  /** Open an https URL in the default browser; rejects if the URL is refused. */
  openExternal: async (url: string) => unwrap(await commands.openExternal(url)),
}

export type AppApi = typeof appApi
