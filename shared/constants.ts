// Single source of truth for the product's brand identity. The Rust side (via
// tauri.conf.json / Cargo.toml) and the frontend both take their brand from
// here instead of hardcoding strings, so rebranding the template is a one-file
// change in code. The static config that can't import TypeScript
// (tauri.conf.json, Cargo.toml, package.json) is kept in sync by `pnpm rebrand`
// (scripts/rebrand.mjs), which rewrites every placeholder in one pass — see the
// "Rebrand checklist" in the README.

/** Reverse-DNS application identifier (Tauri bundle `identifier`). */
export const APP_ID = 'com.soarstarter.tauri-starter'

/** Human-readable product name (window title, About, mailto subjects, installer). */
export const APP_NAME = 'Tauri Starter'

/**
 * Packaging slug: npm `name`, artifact file names, executable name. Lowercase,
 * no spaces.
 */
export const PRODUCT_SLUG = 'tauri-starter'

/** Custom URL scheme for deep links (`tauri-starter://settings`, `tauri-starter://about`, …). */
export const PROTOCOL_SCHEME = 'tauri-starter'

/** Display name registered for the protocol handler (deep-link registration). */
export const PROTOCOL_NAME = APP_NAME

/** Support inbox used by the Help page "Send feedback" action. */
export const SUPPORT_EMAIL = 'contact@soarstarter.com'

/** Source repository; the bug-report flow targets `${REPO_URL}/issues/new`. */
export const REPO_URL = 'https://github.com/soarstarter/tauri-starter'

/** Product homepage / documentation entry point. */
export const HOMEPAGE_URL = 'https://github.com/soarstarter/tauri-starter'

/** License document link shown on the About page. */
export const LICENSE_URL = 'https://github.com/soarstarter/tauri-starter/blob/main/LICENSE'

/**
 * End-User License Agreement shown during first-run onboarding. Leave empty to
 * ship without a EULA gate (the default); set a URL to require acceptance.
 */
export const EULA_URL = ''

/**
 * Bump when the EULA text changes to force re-acceptance. Only meaningful when
 * {@link EULA_URL} is set. Stored acceptance is compared against this number.
 */
export const EULA_VERSION = 1
