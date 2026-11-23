import { appApi } from './app'

// Port of the Electron template's `external-url.ts`: the single guarded helper
// every external link goes through. The webview itself never navigates off-app
// (the CSP `default-src 'self'` enforces that); anything that should open in the
// user's browser or mail client is validated here and handed to the native
// opener via the `app::open_external` command. The Rust command and the scoped
// `opener` capability enforce the same allowlist, so this client-side check is
// the first of three agreeing layers.

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:'])

/**
 * Validate an external URL against the allowlist, returning its normalized
 * string form. Throws for a relative URL, an unparseable value, or a disallowed
 * scheme (`http:`, `file:`, `javascript:`, …).
 */
export const getAllowedExternalUrl = (rawUrl: string): string => {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('External URL must be an absolute URL')
  }

  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
    throw new Error(`External URL protocol is not allowed: ${url.protocol}`)
  }

  return url.toString()
}

/** Validate and open an external URL in the default browser/mail client. */
export const openExternalUrl = async (rawUrl: string): Promise<void> => {
  await appApi.openExternal(getAllowedExternalUrl(rawUrl))
}
