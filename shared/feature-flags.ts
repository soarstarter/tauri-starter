import { features } from './config'

// The frontend's parsed config is the single source of truth for feature flags.
// A subset of those flags also has to reach the Rust side — e.g. the showcase
// flag decides whether the native menu/tray expose the demo catalog. Rather than
// duplicating the env read on the Rust side (the Electron template's MAIN_VITE_*
// approach), the frontend pushes this payload to Rust exactly once at boot via
// the `app::set_feature_flags` command (wired in Phase 2). Keep this shape in
// sync with the Rust `FeatureFlags` struct.

export interface NativeFeatureFlags {
  /** [template-demo] Expose the showcase/demo catalog in native menus & tray. */
  showcase: boolean
}

/** Build the flag payload sent to the Rust side at boot. */
export const getNativeFeatureFlags = (): NativeFeatureFlags => ({
  showcase: features.showcase,
})
